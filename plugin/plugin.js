const PLUGIN_ID = 'com.bugdeployer.audible';
/** @param {unknown} value @returns {Record<string, unknown>} */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppShell.PluginError('invalid_response');
  return /** @type {Record<string, unknown>} */ (value);
}
/** @param {unknown} value @param {number} maximum */
function text(value, maximum = 512) { return typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum) : ''; }
/** @param {unknown} value */
function names(value) { return Array.isArray(value) ? value.slice(0, 32).map(v => text(object(v).name, 256)).filter(Boolean) : []; }
/** @param {import('multiplexr_plugin_sdk').Request} request */
function multiplexrEntry(request) {
  return AppShell.definePlugin({
    'metadata.search': AppShell.contribution('metadata.provider', (params, host) => {
      if (params.kind !== 'audiobook') throw new AppShell.PluginError('unsupported_capability');
      const page = params.cursor == null ? 0 : Number(params.cursor);
      if (!Number.isInteger(page) || page < 0 || page >= 1000) throw new AppShell.PluginError('invalid_request');
      let url = 'https://api.audible.com/1.0/catalog/products?title=' + encodeURIComponent(params.query) +
        '&num_results=5&page=' + page + '&response_groups=contributors,product_attrs,series&products_sort_by=Relevance';
      if (params.creator) url += '&author=' + encodeURIComponent(params.creator);
      const response = object(AppShell.httpJson(host, url));
      if (!Array.isArray(response.products)) throw new AppShell.PluginError('invalid_response');
      const seen = new Set();
      const items = response.products.slice(0, 5).flatMap(raw => {
        const item = object(raw), title = text(item.title), asin = text(item.asin);
        if (!/^[A-Z0-9]{10}$/.test(asin) || !title || seen.has(asin) || !['', 'Product', 'Audiobook'].includes(text(item.content_type))) return [];
        seen.add(asin);
        /** @type {import('multiplexr_plugin_sdk').MetadataFields} */
        const fields = { identifier: 'audible:' + asin };
        for (const [source, target] of /** @type {const} */ ([['publisher_name', 'publisher'], ['language', 'language'], ['release_date', 'publicationDate']])) {
          const value = text(item[source]); if (value) fields[target] = value;
        }
        const narrators = names(item.narrators).join(', ').slice(0, 512);
        if (narrators) fields.narrator = narrators;
        if (Array.isArray(item.series) && item.series.length) {
          const series = text(object(item.series[0]).title); if (series) fields.series = series;
        }
        return [{ id: AppShell.namespacedId(PLUGIN_ID, 'asin.' + asin), title, authors: names(item.authors), fields }];
      });
      const total = Number(response.total_results);
      return AppShell.page(items, page < 999 && response.products.length === 5 && (!Number.isFinite(total) || (page + 1) * 5 < total) ? String(page + 1) : null);
    }, PLUGIN_ID),
  })(request);
}
