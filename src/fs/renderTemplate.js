export function renderTemplate(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in variables)) {
      return '';
    }
    return String(variables[key]);
  });
}
