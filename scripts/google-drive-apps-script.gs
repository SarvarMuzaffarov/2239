/**
 * Google Apps Script — "Iqtidorli Talabalar" Google Drive File Server
 *
 * O'rnatish tartibi (script.google.com):
 * 1. Google Drive hisobingiz (muzaffarovsarvarjon20021222@gmail.com) bilan https://script.google.com ga kiring.
 * 2. "New project" (Yangi loyiha) bosing va ushbu kodni Code.gs ga joylashtiring.
 * 3. (Ixtiyoriy, lekin tavsiya etiladi) Project Settings -> Script Properties ga:
 *    - DRIVE_SECRET = o'zingiz xohlagan maxfiy kalit (masalan: iqtidor_drive_2026_secret) qo'shing.
 * 4. Yuqoridan Deploy -> New deployment -> Select type: Web app tanlang:
 *    - Description: Iqtidorli Talabalar Drive Server
 *    - Execute as: Me (muzaffarovsarvarjon20021222@gmail.com)
 *    - Who has access: Anyone
 * 5. Deploy bosing va ruxsatlarni ("Authorize access") tasdiqlang.
 * 6. Hosil bo'lgan Web app URL ni server muhit o'zgaruvchilariga (GOOGLE_DRIVE_SCRIPT_URL) kiriting.
 */

const ROOT_FOLDER_NAME = 'Iqtidorli_Talabalar_Fayllari';

function getConfiguredSecret_() {
  try {
    return PropertiesService.getScriptProperties().getProperty('DRIVE_SECRET') || '';
  } catch (e) {
    return '';
  }
}

function verifySecret_(incomingSecret) {
  const expected = getConfiguredSecret_();
  if (!expected) return true;
  return String(incomingSecret || '') === String(expected);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder_(parentFolder, name) {
  const safeName = String(name || 'other').replace(/[\\/:*?"<>|]/g, '_').trim() || 'other';
  const folders = parentFolder.getFoldersByName(safeName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(safeName);
}

function getRootFolder_() {
  const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (!verifySecret_(params.secret)) {
      return jsonResponse_({ ok: false, error: 'Unauthorized secret' });
    }

    const fileId = (params.fileId || '').trim();
    if (!fileId) {
      return jsonResponse_({
        ok: true,
        service: 'Iqtidorli Talabalar Google Drive File Server',
        rootFolder: ROOT_FOLDER_NAME,
      });
    }

    const file = DriveApp.getFileById(fileId);
    if (file.isTrashed()) {
      return jsonResponse_({ ok: false, error: 'File is in trash' });
    }

    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const base64 = Utilities.base64Encode(bytes);

    return jsonResponse_({
      ok: true,
      fileId: file.getId(),
      fileName: file.getName(),
      mimeType: blob.getContentType() || 'application/pdf',
      size: bytes.length,
      base64: base64,
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(rawBody);

    if (!verifySecret_(payload.secret)) {
      return jsonResponse_({ ok: false, error: 'Unauthorized secret' });
    }

    const action = payload.action || 'upload';

    if (action === 'delete') {
      const targetId = String(payload.fileId || '').trim();
      if (!targetId) {
        return jsonResponse_({ ok: false, error: 'Missing fileId' });
      }
      const file = DriveApp.getFileById(targetId);
      file.setTrashed(true);
      return jsonResponse_({ ok: true, deleted: true, fileId: targetId });
    }

    if (action === 'upload') {
      const base64Data = String(payload.base64 || '');
      if (!base64Data) {
        return jsonResponse_({ ok: false, error: 'Missing base64 file data' });
      }

      const fileName = String(payload.fileName || 'hujjat.pdf').trim();
      const mimeType = String(payload.mimeType || 'application/pdf').trim();
      const category = String(payload.category || 'other').trim();

      const cleanBase64 = base64Data.indexOf('base64,') >= 0
        ? base64Data.split('base64,')[1]
        : base64Data;

      const bytes = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(bytes, mimeType, fileName);

      const rootFolder = getRootFolder_();
      const categoryFolder = getOrCreateFolder_(rootFolder, category);
      const createdFile = categoryFolder.createFile(blob);

      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // Non-fatal if organization restricts link sharing; proxy download still works as Me
      }

      return jsonResponse_({
        ok: true,
        fileId: createdFile.getId(),
        fileName: createdFile.getName(),
        mimeType: mimeType,
        size: createdFile.getSize(),
        webViewUrl: createdFile.getUrl(),
      });
    }

    return jsonResponse_({ ok: false, error: 'Unsupported action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
