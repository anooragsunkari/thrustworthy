import test from 'node:test';
import assert from 'node:assert/strict';
import { isHeic, photoDuplicate, photoPrecheck, photoReadProblem, photoSaveProblem, storageProblem } from '../src/lib/problems.js';

const file = (name, type, size = 2048) => ({ name, type, size });
const err = (name, message = '') => Object.assign(new Error(message), { name });

test('a normal photo passes the precheck', () => {
  assert.equal(photoPrecheck(file('frame.jpg', 'image/jpeg')), null);
  assert.equal(photoPrecheck(file('frame.heic', '')), null);
});

test('an empty file is explained as not downloaded yet', () => {
  const p = photoPrecheck(file('frame.jpg', 'image/jpeg', 0));
  assert.match(p.title, /empty/);
  assert.match(p.body, /0 bytes/);
  assert.match(p.body, /frame\.jpg/);
});

test('a file that is not an image names its type', () => {
  assert.match(photoPrecheck(file('notes.pdf', 'application/pdf')).body, /"notes\.pdf" is a \.pdf file, not an image/);
  assert.match(photoPrecheck(file('notes', 'application/pdf')).body, /a file of type application\/pdf/);
});

test('read failures explain HEIC, size, or damage', () => {
  assert.ok(isHeic(file('IMG_1.HEIC', '')));
  assert.match(photoReadProblem(file('IMG_1.heic', 'image/heic')).title, /HEIC/);
  assert.match(photoReadProblem(file('huge.jpg', 'image/jpeg', 40 * 1048576)).body, /40 MB/);
  assert.match(photoReadProblem(file('bad.jpg', 'image/jpeg')).body, /damaged/);
});

test('a duplicate names the step it is already on', () => {
  const p = photoDuplicate(file('arm.jpg', 'image/jpeg'), 'Mount the motors');
  assert.match(p.body, /"arm\.jpg" is already the photo for "Mount the motors"/);
});

test('save failures say why', () => {
  assert.match(photoSaveProblem(err('QuotaExceededError')).title, /Not enough space/);
  assert.match(photoSaveProblem(err('InvalidStateError')).body, /private browsing/);
  assert.match(photoSaveProblem(err('SecurityError'), 'removed').title, /not removed/);
  assert.match(photoSaveProblem(err('Weird', 'disk on fire')).body, /disk on fire/);
});

test('a failed save of builds warns that work will be lost', () => {
  assert.match(storageProblem(err('QuotaExceededError')).body, /lost when you close this tab/);
  assert.match(storageProblem(err('SecurityError')).body, /private browsing/);
  assert.match(storageProblem({ code: 22 }).body, /no storage left/);
});
