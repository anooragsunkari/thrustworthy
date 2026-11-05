import React, { useMemo, useRef, useState } from 'react';
import { A, Sheet } from './ui.jsx';
import { addCustomPart, getState, setOwnedQty, updateCustomPart, useStore } from '../lib/store.js';
import { t } from '../lib/util.js';
import { partName, SLOTS } from '../data/parts.js';
import { cleanCustom, fieldsFor, formValues } from '../lib/custom.js';
import { brokenBuilds, buildsUsing } from '../lib/owned.js';

const optionLabel = (o) => ({ sub: '868/915 MHz', 2.4: '2.4 GHz', '4in1': '4-in-1', single: t('Single'), pixhawk: 'Pixhawk', arm: t('On the arms') }[o] || o);

/**
 * Add a part, or change one you saved. Pass `part` to edit it. Pass `own` to record that you own a
 * new part (a count, or a function of the saved part), and `askOwn` to let the person say whether they do.
 */
export function PartForm({ slot, part = null, own = 0, askOwn = false, onDone, onCancel }) {
  const key = part?.slot || slot;
  const fields = fieldsFor(key);
  const { projects } = useStore();
  const uses = part ? buildsUsing(projects, part.id).length : 0;
  const [values, setValues] = useState(() => formValues(key, part));
  const [errors, setErrors] = useState({});
  const [mine, setMine] = useState(!!own && !askOwn);
  const set = (k, v) => setValues({ ...values, [k]: v });
  const save = (e) => {
    e.preventDefault();
    const { part: clean, errors: errs } = cleanCustom(key, values);
    if (!clean) {
      setErrors(Object.fromEntries(errs.map((x) => [x.key, x.message])));
      return;
    }
    const saved = part ? updateCustomPart(part.id, clean) : addCustomPart(clean);
    if (!part && mine) setOwnedQty(saved.id, typeof own === 'function' ? own(saved) : own || 1);
    onDone(saved);
  };
  return (
    <form className="stack" onSubmit={save} noValidate>
      <div className="note">
        {part
          ? (uses ? t(uses === 1 ? 'One build uses this part. It will pick up your changes, and its checks will run again.' : '{n} builds use this part. They will all pick up your changes, and their checks will run again.', { n: uses }) : t('No build uses this part yet.'))
          : t('It is saved on this device and works in the checker like any other part. Use the maker\'s published numbers if you can.')}
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          {f.kind === 'multi' ? (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="tiny muted" style={{ marginBottom: 6, padding: 0 }}>{t(f.label)}</legend>
              <div className="chips">
                {f.options.map((o) => {
                  const on = values[f.key].includes(o);
                  return <button type="button" key={o} className={`filter ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set(f.key, on ? values[f.key].filter((x) => x !== o) : [...values[f.key], o])}>{optionLabel(o)}</button>;
                })}
              </div>
            </fieldset>
          ) : (
            <label className="field">
              <span>{t(f.label)}</span>
              {f.kind === 'select' ? (
                <select className="input" value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  {f.options.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}
                </select>
              ) : f.kind === 'bool' ? (
                <select className="input" value={String(values[f.key])} onChange={(e) => set(f.key, e.target.value === 'true')}>
                  <option value="true">{t('Yes')}</option><option value="false">{t('No')}</option>
                </select>
              ) : (
                <input className="input" type={f.kind === 'num' ? 'number' : 'text'} inputMode={f.kind === 'num' ? 'decimal' : undefined} step="any" value={values[f.key]} maxLength={60} aria-invalid={!!errors[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </label>
          )}
          {errors[f.key] && <div className="small" role="alert" style={{ color: 'var(--err)', marginTop: 4 }}>{t(errors[f.key])}</div>}
        </div>
      ))}
      {!part && askOwn && (
        <label className="check" style={{ padding: '4px 0' }}>
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          <span className="grow"><div className="title">{t('I already own this')}</div><div className="small muted">{t('It comes off your shopping list.')}</div></span>
        </label>
      )}
      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onCancel}>{t('Back')}</button>
        <button className="btn">{part ? t('Save changes') : t('Save and use it')}</button>
      </div>
    </form>
  );
}

/** Edit a saved part, then report any build the change has broken. */
export function EditPartSheet({ part, onClose, onSaved }) {
  const state = useStore();
  const before = useRef(new Set(brokenBuilds(state.projects, part.id).map((p) => p.id)));
  const label = useMemo(() => SLOTS.find((s) => s.key === part.slot)?.label || '', [part.slot]);
  return (
    <Sheet title={t('Edit {name}', { name: partName(part) })} sub={t(label)} onClose={onClose}>
      {(close) => (
        <PartForm
          part={part}
          onCancel={close}
          onDone={() => {
            const fresh = brokenBuilds(getState().projects, part.id).filter((p) => !before.current.has(p.id));
            onSaved?.(fresh);
            close();
          }}
        />
      )}
    </Sheet>
  );
}

/** Stays on screen, because a build that can no longer fly is too important for a toast. */
export const BrokenBuilds = ({ builds }) => (builds?.length ? (
  <div className="note err" role="alert" style={{ marginBottom: 12 }}>
    <b>{t('Your change created a problem')}</b>
    {builds.map((p) => <div key={p.id}><A to={`/configure/${p.id}`} className="link">{t('Fix {name}', { name: p.name })}</A></div>)}
  </div>
) : null);
