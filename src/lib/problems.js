// Plain-language explanations for when a photo or a save does not work. No DOM, so `node --test` can check them.

const mb = (bytes) => Math.round((bytes / 1048576) * 10) / 10;
const ext = (name = '') => (/\.([a-z0-9]+)$/i.exec(name)?.[1] || '').toLowerCase();
const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif', 'heic', 'heif'];

export const isHeic = (file) => /^image\/hei[cf]/i.test(file?.type || '') || ['heic', 'heif'].includes(ext(file?.name));

/** Problems we can spot before trying to open the file. */
export function photoPrecheck(file) {
  const name = file?.name || 'This file';
  if (!file || file.size === 0) {
    return {
      title: 'This photo is empty',
      body: `"${name}" is 0 bytes, so there is no picture in it. This usually means it has not finished downloading, for example from iCloud or Google Photos. Open it once in your photos app, then try again.`,
    };
  }
  const type = file.type || '';
  const looksLikeImage = type ? type.startsWith('image/') : IMAGE_EXT.includes(ext(file.name));
  if (!looksLikeImage) {
    const kind = ext(file.name) ? `a .${ext(file.name)} file` : type ? `a file of type ${type}` : 'not a file the browser recognises';
    return {
      title: 'That is not a photo',
      body: `"${name}" is ${kind}, not an image. Pick a JPEG, PNG, WebP or GIF photo.`,
    };
  }
  return null;
}

/** The file could not be turned into a picture. `stage` says which step failed. */
export function photoReadProblem(file, stage = 'read') {
  const name = file?.name || 'This photo';
  if (stage === 'heic-download') {
    return {
      title: 'The HEIC converter could not be downloaded',
      body: `"${name}" is a HEIC photo, the format iPhones use by default. This browser cannot open HEIC on its own, so the site downloads a converter the first time you add one, and that download failed. Check your internet connection and try again.`,
    };
  }
  if (stage === 'heic-convert' || isHeic(file)) {
    return {
      title: 'This HEIC photo could not be converted',
      body: `"${name}" could not be turned into a JPEG. The file may be damaged or only partly downloaded, for example still syncing from iCloud. Open it once in your photos app and try again, or export it as a JPEG.`,
    };
  }
  if (file?.size > 25 * 1048576) {
    return {
      title: 'This photo is too large to open',
      body: `"${name}" is ${mb(file.size)} MB, which is more than this browser could open on this device. Try a smaller copy, such as a screenshot or an exported JPEG.`,
    };
  }
  return {
    title: 'This photo could not be read',
    body: `The browser could not open "${name}". The file may be damaged or only partly downloaded, or its format may not be supported here. JPEG and PNG work everywhere.`,
  };
}

/** The same photo is already used on another step of this build. */
export function photoDuplicate(file, stepTitle) {
  return {
    title: 'You already added this photo',
    body: `"${file?.name || 'This photo'}" is already the photo for "${stepTitle || 'another step'}". Pick a different photo for this step, or remove it from that step first.`,
  };
}

const errName = (err) => err?.name || (err?.code === 22 ? 'QuotaExceededError' : '');

function isQuota(err) {
  const n = errName(err);
  return n === 'QuotaExceededError' || n === 'NS_ERROR_DOM_QUOTA_REACHED' || err?.code === 22 || err?.code === 1014;
}

const BLOCKED = ['SecurityError', 'InvalidStateError', 'NotAllowedError', 'UnknownError'];

/** Saving (or removing) a photo on the device failed. */
export function photoSaveProblem(err, action = 'saved') {
  if (isQuota(err)) {
    return {
      title: `Not enough space, so the photo was not ${action}`,
      body: 'Your device or browser has run out of storage for this site. Free up some space on your device, or remove photos from other steps, then try again.',
    };
  }
  if (BLOCKED.includes(errName(err))) {
    return {
      title: `Your browser blocked it, so the photo was not ${action}`,
      body: 'This browser is not letting this site use storage. That happens in private browsing on some browsers, or when cookies and site data are turned off in your browser settings. Open the site in a normal window, or allow site data, then try again.',
    };
  }
  return {
    title: `The photo was not ${action}`,
    body: `Something went wrong on this device${err?.message ? ` (the browser said: "${err.message}")` : ''}. Try again, and if it keeps happening, try another browser.`,
  };
}

/** Saving builds and settings failed, so nothing will survive closing the tab. */
export function storageProblem(err) {
  if (isQuota(err)) {
    return {
      title: 'Your changes are not being saved',
      body: 'This browser has no storage left for this site, or allows none in private browsing. Everything you do now will be lost when you close this tab. Leave private browsing or free up space on your device, and download a backup from Me to keep your work.',
    };
  }
  return {
    title: 'Your changes are not being saved',
    body: 'This browser is blocking this site from saving, usually because you are in private browsing or have cookies and site data turned off. Everything you do now will be lost when you close this tab. Open the site in a normal window, or allow site data, and download a backup from Me to keep your work.',
  };
}
