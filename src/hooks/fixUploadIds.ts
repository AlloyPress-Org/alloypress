export const fixUploadIds = (node: any): any => {
  if (Array.isArray(node)) return node.map(fixUploadIds)

  if (node && typeof node === 'object') {
    if (node.type === 'upload' && typeof node.value === 'string' && /^\d+$/.test(node.value)) {
      node.value = Number(node.value)
    }
    for (const key of Object.keys(node)) {
      node[key] = fixUploadIds(node[key])
    }
  }

  return node
}