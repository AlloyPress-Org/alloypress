// Runs on the rich-text value before validation/save.
//  1. upload ids pasted as strings ("885") -> numbers (Postgres numeric ids)
//  2. drops "pendingImage" placeholders (a paste whose upload had not finished yet)
export const fixUploadIds = (node: any): any => {
  if (Array.isArray(node)) {
    return node
      .filter((child) => !(child && typeof child === 'object' && child.type === 'pendingImage'))
      .map(fixUploadIds)
  }

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