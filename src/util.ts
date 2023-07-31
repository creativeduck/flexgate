export function getCodeByPath(url: string, want: string) {
  const urls = new URL(url).pathname.split('/')
  let index = 0

  while (index < urls.length) {
    if (urls[index++] === want) {
      break
    }
  }

  if (index === urls.length) {
    return null
  }
  return urls[index]
}

export function maskingName(name: string) {
  if (name.length <= 2) {
    return name.replace(/.$/, '*')
  } else {
    const strArr = name
      .split('')
      .map((str, index) => {
        if (index === 0 || index === name.length - 1) {
          return str
        }
        return '*'
      })
      .join()
      .replace(/,/gi, '')

    return strArr
  }
}
