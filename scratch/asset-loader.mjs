export async function load(url, context, defaultLoad) {
  if (/\.(png|jpg|jpeg|svg|mp3|m4a|wav)(\?.*)?$/i.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default ' + JSON.stringify(url) + ';',
    };
  }
  return defaultLoad(url, context);
}
