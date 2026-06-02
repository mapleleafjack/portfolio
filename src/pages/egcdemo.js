import React from 'react';

const EGCDemo = () => {
  React.useEffect(() => {
    // Remove Gatsby's default styles on this page
    document.body.className = '';
    document.body.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      color: #1a1a1a;
      padding: 40px 32px 80px;
      margin: 0;
    `;
    return () => {
      document.body.style.cssText = '';
    };
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: EGC_HTML }} />
  );
};

export default EGCDemo;

export const Head = () => (
  <>
    <title>EGC Intake — Panoramica Schermate</title>
    <meta name="robots" content="noindex" />
    <style>{EGC_STYLES}</style>
  </>
);

const EGC_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #fff !important;
    color: #1a1a1a;
    padding: 40px 32px 80px;
  }
  #___gatsby > div { background: #fff !important; }
  h1 { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 4px; }
  .subtitle { font-size: 14px; color: #888; text-align: center; margin-bottom: 48px; }
  .flow { display: flex; flex-direction: column; align-items: center; }
  .arrow { display: flex; flex-direction: column; align-items: center; padding: 12px 0; color: #ccc; font-size: 13px; line-height: 1; }
  .arrow .line { width: 2px; height: 20px; background: #ddd; }
  .arrow .head { font-size: 18px; color: #bbb; margin-top: -2px; }
  .arrow .label { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .branch-label { text-align: center; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 8px; }
  .branch-arrows { display: flex; justify-content: center; gap: 0; margin-bottom: 8px; position: relative; width: 100%; max-width: 1100px; }
  .branch-arrows .ba { flex: 1; display: flex; flex-direction: column; align-items: center; color: #ccc; }
  .branch-arrows .ba .line { width: 2px; height: 24px; background: #ddd; }
  .branch-arrows .ba .head { font-size: 16px; color: #bbb; margin-top: -2px; }
  .branch-arrows .ba .pct { font-size: 10px; color: #aaa; font-weight: 600; margin-top: 2px; }
  .branch-arrows::before { content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 2px; background: #ddd; }
  .converge-arrows { display: flex; justify-content: center; gap: 0; margin-top: 8px; position: relative; width: 100%; max-width: 1100px; }
  .converge-arrows .ba { flex: 1; display: flex; flex-direction: column; align-items: center; color: #ccc; }
  .converge-arrows .ba .line { width: 2px; height: 24px; background: #ddd; }
  .converge-arrows::after { content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 2px; background: #ddd; }
  .converge-point { display: flex; flex-direction: column; align-items: center; color: #ccc; padding: 0 0 8px; }
  .converge-point .line { width: 2px; height: 20px; background: #ddd; }
  .converge-point .head { font-size: 18px; color: #bbb; margin-top: -2px; }
  .cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; width: 100%; max-width: 1100px; }
  .card { border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; min-width: 0; }
  .card-status { padding: 8px 12px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .card-status.green { background: #f0fdf4; color: #16a34a; }
  .card-status.yellow { background: #fefce8; color: #a16207; }
  .card-status.red { background: #fef2f2; color: #dc2626; }
  .card-status.orange { background: #fff7ed; color: #c2410c; }
  .card-status.blue { background: #eff6ff; color: #2563eb; }
  .card-status.purple { background: #faf5ff; color: #7c3aed; }
  .card-status.home { background: #f8fafc; color: #475569; }
  .card-body { padding: 12px; }
  .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .card-label.green { color: #16a34a; }
  .card-label.yellow { color: #ca8a04; }
  .card-label.red { color: #dc2626; }
  .card-label.orange { color: #ea580c; }
  .card-label.blue { color: #2563eb; }
  .card-label.purple { color: #7c3aed; }
  .card-label.home { color: #64748b; }
  .card-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .result { display: flex; gap: 10px; margin-bottom: 10px; }
  .thumb { width: 44px; height: 60px; border-radius: 4px; background: #f3f3f3; border: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #aaa; flex-shrink: 0; }
  .result-meta { flex: 1; min-width: 0; }
  .result-meta .title { font-size: 13px; font-weight: 700; }
  .result-meta .pub { font-size: 11px; color: #888; margin-top: 1px; }
  .result-meta .detail { font-size: 11px; color: #888; margin-top: 1px; }
  .result-meta .src { display: inline-block; margin-top: 4px; font-size: 9px; color: #999; background: #f5f5f5; padding: 1px 6px; border-radius: 3px; }
  .barcode { font-family: 'SF Mono', 'Menlo', monospace; font-size: 11px; color: #444; background: #f9f9f9; padding: 6px 10px; border-radius: 5px; margin-bottom: 10px; word-break: break-all; }
  .barcode .meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #999; margin-top: 3px; }
  .actions { display: flex; gap: 6px; margin-top: 10px; }
  .btn { flex: 1; padding: 7px 6px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center; border: none; }
  .btn-g { background: #dcfce7; color: #15803d; }
  .btn-gray { background: #f3f3f3; color: #666; }
  .btn-blue { background: #dbeafe; color: #1d4ed8; }
  .note { font-size: 10px; color: #2563eb; background: #eff6ff; padding: 6px 8px; border-radius: 5px; margin-top: 8px; line-height: 1.3; }
  .stages { font-size: 11px; color: #888; margin-bottom: 8px; line-height: 1.6; }
  .stages .fail { color: #dc2626; font-weight: 600; }
  .field { margin-bottom: 8px; }
  .field label { display: block; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #999; margin-bottom: 2px; }
  .field input, .field select { width: 100%; padding: 6px 8px; border: 1px solid #e0e0e0; border-radius: 5px; font-size: 12px; color: #333; background: #fafafa; font-family: inherit; }
  .field .hint { font-size: 9px; color: #2563eb; margin-top: 1px; }
  .field-row { display: flex; gap: 6px; }
  .field-row .field { flex: 1; }
  .series-opt { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 4px; font-size: 11px; }
  .series-opt.sel { border-color: #ea580c; background: #fff7ed; }
  .dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ccc; flex-shrink: 0; }
  .series-opt.sel .dot { border-color: #ea580c; background: #ea580c; box-shadow: inset 0 0 0 2px #fff; }
  .series-name { font-weight: 600; font-size: 11px; }
  .series-pub { font-size: 10px; color: #999; }
  .wrong-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; font-size: 11px; color: #b91c1c; }
  .wrong-box .lbl { font-size: 9px; color: #f87171; text-transform: uppercase; font-weight: 600; margin-bottom: 3px; }
  .auto-hint { font-size: 10px; color: #a16207; background: #fefce8; padding: 5px 8px; border-radius: 5px; margin-bottom: 8px; }
  .home-card { width: 100%; max-width: 320px; }
  .home-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .home-btn { padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; border: none; }
  .home-btn.primary { background: #1a1a1a; color: #fff; }
  .home-btn.secondary { background: #f3f3f3; color: #555; }
  .home-input-row { display: flex; gap: 8px; margin-top: 8px; }
  .home-input-row input { flex: 1; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 13px; font-family: 'SF Mono', 'Menlo', monospace; color: #333; background: #fafafa; }
  .home-input-row .go { padding: 10px 16px; border-radius: 8px; background: #f3f3f3; border: none; font-size: 13px; font-weight: 600; color: #555; }
  .grading-card { width: 100%; max-width: 320px; }
  .bottom-row { display: flex; gap: 20px; width: 100%; max-width: 1000px; align-items: flex-start; }
  .bottom-col { flex: 1; min-width: 0; }
  .bottom-col-center { flex: 1.2; min-width: 0; }
  .flow-badge { display: inline-block; font-size: 9px; font-weight: 600; padding: 3px 8px; border-radius: 4px; margin-bottom: 6px; }
  .flow-badge.blue { color: #2563eb; background: #eff6ff; }
  .flow-badge.green { color: #16a34a; background: #f0fdf4; }
  .flow-badge.purple { color: #7c3aed; background: #faf5ff; }
  .inv-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
  .inv-card .inv-icon { font-size: 28px; margin-bottom: 6px; }
  .inv-card .inv-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .inv-card .inv-sub { font-size: 11px; color: #888; line-height: 1.4; margin-bottom: 10px; }
  .inv-divider { border: none; border-top: 1px dashed #e2e8f0; margin: 10px 0; }
  .inv-section-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; text-align: left; }
  .inv-detail { font-size: 11px; color: #555; text-align: left; line-height: 1.5; margin-bottom: 6px; }
  .inv-detail b { color: #1a1a1a; }
  .inv-copies { display: inline-block; font-size: 10px; font-weight: 600; color: #7c3aed; background: #faf5ff; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px; }
  .inv-actions { display: flex; gap: 8px; }
  .inv-actions .inv-btn { flex: 1; padding: 10px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; border: none; }
  .inv-btn.primary { background: #1a1a1a; color: #fff; }
  .inv-btn.grade { background: #faf5ff; color: #7c3aed; border: 1px solid #e9d5ff; }
  .inv-connector { text-align: center; padding: 8px 0; color: #bbb; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .inv-connector .head { font-size: 14px; }
  .downstream-row { display: flex; gap: 20px; width: 100%; max-width: 1000px; align-items: flex-start; }
  .downstream-row > div { flex: 1; min-width: 0; }
  .ds-card { border: 1px solid #e5e5e5; border-radius: 10px; overflow: hidden; }
  .ds-header { padding: 8px 12px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .ds-header.success { background: #f0fdf4; color: #16a34a; }
  .ds-header.db { background: #eff6ff; color: #2563eb; }
  .ds-header.excel { background: #fefce8; color: #a16207; }
  .ds-body { padding: 12px; }
  .ds-body .ds-msg { font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 8px; }
  .ds-body .ds-msg b { color: #1a1a1a; }
  .ds-table { width: 100%; border-collapse: collapse; font-size: 9px; color: #555; }
  .ds-table th { text-align: left; padding: 4px 6px; background: #f8fafc; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
  .ds-table td { padding: 4px 6px; border-bottom: 1px solid #f3f3f3; }
  .ds-table tr:last-child td { border-bottom: none; }
  .ds-table .highlight { background: #eff6ff; }
  .ds-excel-bar { display: flex; gap: 1px; margin-bottom: 8px; }
  .ds-excel-bar .col-head { flex: 1; padding: 3px 4px; background: #f0f0f0; font-size: 8px; font-weight: 600; color: #888; text-align: center; border: 1px solid #ddd; }
  .ds-excel-row { display: flex; gap: 1px; margin-bottom: 1px; }
  .ds-excel-row .cell { flex: 1; padding: 3px 4px; font-size: 8px; color: #555; background: #fff; border: 1px solid #e8e8e8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ds-excel-row.hl .cell { background: #fefce8; }
  @media (max-width: 900px) {
    .cards-row { grid-template-columns: repeat(2, 1fr); }
    .branch-arrows, .converge-arrows { max-width: 100%; }
    .bottom-row { flex-wrap: wrap; }
    .bottom-col, .bottom-col-center { flex: 1 1 260px; }
    .downstream-row { flex-wrap: wrap; }
    .downstream-row > div { flex: 1 1 280px; }
  }
  @media (max-width: 600px) {
    body { padding: 24px 12px 60px; }
    .cards-row { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
    .branch-arrows, .converge-arrows { display: none; }
    .branch-label { display: none; }
    .bottom-row { flex-direction: column; align-items: stretch; max-width: 360px; margin: 0 auto; }
    .downstream-row { flex-direction: column; align-items: stretch; max-width: 360px; margin: 0 auto; }
  }
`;

const EGC_HTML = `
<h1>EGC Intake System</h1>
<p class="subtitle">Flusso operatore — Schermata Home, 4 scenari di scansione, Correzione e Valutazione</p>

<div class="flow">

  <div class="home-card">
    <div class="card-label home">Schermata Principale</div>
    <div class="card-title">Home</div>
    <div class="card">
      <div class="card-status home">📱 EGC Intake</div>
      <div class="card-body">
        <div class="home-actions">
          <div class="home-btn primary">📷 Scansiona Barcode</div>
          <div class="home-btn secondary">⌨️ Inserimento Manuale</div>
        </div>
        <div class="home-input-row">
          <input placeholder="Inserisci codice a barre..." value="" readonly>
          <div class="go">Cerca</div>
        </div>
      </div>
    </div>
  </div>

  <div class="arrow">
    <div class="line"></div>
    <div class="head">▼</div>
    <div class="label">Scansione → Ricerca automatica</div>
  </div>

  <div class="branch-label">4 possibili esiti</div>

  <div class="branch-arrows">
    <div class="ba"><div class="line"></div><div class="head">▼</div><div class="pct">~70-80%</div></div>
    <div class="ba"><div class="line"></div><div class="head">▼</div><div class="pct">~15-20%</div></div>
    <div class="ba"><div class="line"></div><div class="head">▼</div><div class="pct">raro</div></div>
    <div class="ba"><div class="line"></div><div class="head">▼</div><div class="pct">~5-10%</div></div>
  </div>

  <div class="cards-row">

    <div>
      <div class="card-label green">Scenario A</div>
      <div class="card-title">Corrispondenza</div>
      <div class="card">
        <div class="card-status green">✅ Trovato</div>
        <div class="card-body">
          <div class="result">
            <div class="thumb">cover</div>
            <div class="result-meta">
              <div class="title">Dylan Dog Oldboy n.s.</div>
              <div class="pub">Sergio Bonelli Editore</div>
              <div class="detail">N° copertina: <b>3</b> · Progressivo: <b>70</b></div>
              <div class="src">Database Locale · 5ms</div>
            </div>
          </div>
          <div class="barcode">977182645200750070<div class="meta">ISSN · Addon 50070</div></div>
          <div class="actions">
            <div class="btn btn-g">Conferma ✓</div>
            <div class="btn btn-gray">Errato ✗</div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="card-label yellow">Scenario B</div>
      <div class="card-title">Trovato via API</div>
      <div class="card">
        <div class="card-status yellow">🔍 Trovato via API</div>
        <div class="card-body">
          <div class="result">
            <div class="thumb">cover</div>
            <div class="result-meta">
              <div class="title">My Dress-Up Darling</div>
              <div class="pub">Shinichi Fukuda</div>
              <div class="src">Google Books · 476ms</div>
            </div>
          </div>
          <div class="barcode">9788834908778<div class="meta">ISBN · Checksum ✓</div></div>
          <div class="actions">
            <div class="btn btn-g">Conferma ✓</div>
            <div class="btn btn-gray">Errato ✗</div>
          </div>
          <div class="note">ⓘ Verrà salvato localmente. Prossima scansione → istantaneo.</div>
        </div>
      </div>
    </div>

    <div>
      <div class="card-label orange">Scenario C</div>
      <div class="card-title">Serie Ambigua</div>
      <div class="card">
        <div class="card-status orange">🟡 Serie Multiple</div>
        <div class="card-body">
          <div class="barcode">977182645200750070<div class="meta">ISSN · Progressivo: #70</div></div>
          <div style="font-size:11px; color:#666; margin-bottom:6px;">Questo codice corrisponde a <b>3 serie</b>:</div>
          <div class="series-opt">
            <div class="dot"></div>
            <div><span class="series-name">Dylan Dog Oldboy</span><br/><span class="series-pub">23 numeri</span></div>
          </div>
          <div class="series-opt">
            <div class="dot"></div>
            <div><span class="series-name">Maxi Dylan Dog</span><br/><span class="series-pub">22 numeri</span></div>
          </div>
          <div class="series-opt sel">
            <div class="dot"></div>
            <div><span class="series-name">DD Oldboy n. serie</span><br/><span class="series-pub">4 numeri</span></div>
          </div>
          <div class="field-row" style="margin-top:8px">
            <div class="field">
              <label>N° Copertina</label>
              <input value="3" readonly>
            </div>
            <div class="field">
              <label>Progressivo</label>
              <input value="70" readonly>
            </div>
          </div>
          <div class="actions">
            <div class="btn btn-blue">Salva e Registra ✓</div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="card-label red">Scenario D</div>
      <div class="card-title">Nessun Risultato</div>
      <div class="card">
        <div class="card-status red">⚠️ Non Trovato</div>
        <div class="card-body">
          <div class="barcode">977112158004750467<div class="meta">ISSN (Edicola) · Numero: #467</div></div>
          <div class="stages">
            <span class="fail">✗</span> DB Locale — non trovato<br/>
            <span class="fail">✗</span> Comic Vine — 0 risultati per #467
          </div>
          <div class="field">
            <label>Titolo</label>
            <input value="Dylan Dog" readonly>
            <div class="hint">pre-compilato</div>
          </div>
          <div class="field">
            <label>Editore</label>
            <input value="Sergio Bonelli Editore" readonly>
          </div>
          <div class="field">
            <label>Numero</label>
            <input value="467" readonly>
            <div class="hint">pre-compilato da addon</div>
          </div>
          <div class="actions">
            <div class="btn btn-blue">Salva e Registra ✓</div>
          </div>
          <div class="note">ⓘ Salvato nel catalogo locale. Scansioni future → istantaneo.</div>
        </div>
      </div>
    </div>

  </div>

  <div class="converge-arrows">
    <div class="ba"><div class="line"></div></div>
    <div class="ba"><div class="line"></div></div>
    <div class="ba"><div class="line"></div></div>
    <div class="ba"><div class="line"></div></div>
  </div>
  <div class="converge-point">
    <div class="line"></div>
    <div class="head">▼</div>
  </div>

  <div class="bottom-row">

    <div class="bottom-col">
      <div class="flow-badge blue">← Da pulsante "Errato ✗"</div>
      <div class="card-label blue">Sempre Disponibile</div>
      <div class="card-title">Correzione</div>
      <div class="card">
        <div class="card-status blue">✏️ Modalità Correzione</div>
        <div class="card-body">
          <div class="wrong-box">
            <div class="lbl">Il sistema suggeriva</div>
            <b>✗ Dylan Dog #401</b><br/>
            Sergio Bonelli Editore
          </div>
          <div class="field">
            <label>Titolo</label>
            <input value="Dylan Dog" readonly>
          </div>
          <div class="field">
            <label>Numero Corretto</label>
            <input placeholder="Inserisci numero...">
          </div>
          <div class="field-row">
            <div class="field">
              <label>Variante</label>
              <select><option>Regolare</option></select>
            </div>
            <div class="field">
              <label>Stampa</label>
              <select><option>1ª</option></select>
            </div>
          </div>
          <div class="actions">
            <div class="btn btn-blue">Salva Correzione ✓</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-col-center">
      <div class="flow-badge green">↑ Da "Conferma ✓" o "Salva"</div>
      <div class="card-label home">Risultato</div>
      <div class="card-title">Registrato</div>
      <div class="inv-card">
        <div class="inv-icon">📦</div>
        <div class="inv-title">Registrazione completata</div>

        <div class="inv-section-label">📚 Catalogo Fumetti (DB generico)</div>
        <div class="inv-detail">
          <b>Dylan Dog Oldboy n.s. #3</b><br/>
          Sergio Bonelli Editore · ISSN 977182645200750070<br/>
          1 voce nel catalogo — riutilizzata per tutte le copie
        </div>

        <hr class="inv-divider">

        <div class="inv-section-label">📋 Copia Fisica</div>
        <div class="inv-detail">
          Ogni copia gradata riceve un ID unico.<br/>
          Premendo "Valuta" verrà assegnato:<br/>
          <b>EGC-2026-004712</b> (progressivo automatico)
        </div>
        <div class="inv-copies">Già 3 copie di questo fumetto gradate</div>

        <div class="inv-actions">
          <div class="inv-btn primary">📷 Scansiona Prossimo</div>
          <div class="inv-btn grade">📋 Valuta Questa Copia</div>
        </div>
      </div>
      <div class="inv-connector">
        <div class="head">▼</div>
        <span>Solo se si preme "Valuta"</span>
      </div>
    </div>

    <div class="bottom-col">
      <div class="flow-badge purple">← Solo dal pulsante "Valuta"</div>
      <div class="card-label purple">Opzionale · Per Singola Copia</div>
      <div class="card-title">Valutazione (Grading)</div>
      <div class="card">
        <div class="card-status purple">📋 Valutazione</div>
        <div class="card-body">
          <div class="result">
            <div class="thumb">cover</div>
            <div class="result-meta">
              <div class="title">Dylan Dog #468</div>
              <div class="pub">Sergio Bonelli Editore</div>
              <div class="detail">Pubblicazione: <b>2026</b></div>
              <div class="src">Copia EGC-2026-004712</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Voto</label>
              <select><option>9.8 — NM/MT</option></select>
            </div>
            <div class="field">
              <label>Qualità Pagine</label>
              <select><option>WHITE</option></select>
            </div>
          </div>
          <div class="auto-hint">ⓘ Suggerito: anno pubblicazione = 2026</div>
          <div class="field-row">
            <div class="field">
              <label>Categoria</label>
              <select><option>B — Bonelli</option></select>
            </div>
            <div class="field">
              <label>Difetti / Note</label>
              <input placeholder="Stress dorso, angoli...">
            </div>
          </div>
          <div class="actions">
            <div class="btn btn-g">Registra Voto ✓</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="arrow">
    <div class="line"></div>
    <div class="head">▼</div>
    <div class="label">Downstream</div>
  </div>

  <div class="downstream-row">

    <div>
      <div class="card-label green">Feedback Operatore</div>
      <div class="card-title">Schermata Successo</div>
      <div class="ds-card">
        <div class="ds-header success">✅ Registrazione Completata</div>
        <div class="ds-body">
          <div style="text-align:center; font-size:32px; margin-bottom:8px;">🎉</div>
          <div class="ds-msg" style="text-align:center;">
            <b>Dylan Dog Oldboy n.s. #3</b><br/>
            Voto: <b>9.8 NM/MT</b> · Pagine: <b>WHITE</b><br/>
            ID: <b>EGC-2026-004712</b>
          </div>
          <div class="actions">
            <div class="btn btn-g">📷 Scansiona Prossimo</div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="card-label blue">Persistenza</div>
      <div class="card-title">Database</div>
      <div class="ds-card">
        <div class="ds-header db">🗃️ Tabella Copie Gradate</div>
        <div class="ds-body">
          <table class="ds-table">
            <tr><th>ID</th><th>Titolo</th><th>N°</th><th>Voto</th><th>Pagine</th><th>Cat</th></tr>
            <tr><td>...4710</td><td>One Piece</td><td>108</td><td>9.6</td><td>WHITE</td><td>M</td></tr>
            <tr><td>...4711</td><td>Dylan Dog</td><td>468</td><td>8.0</td><td>CREAM</td><td>B</td></tr>
            <tr class="highlight"><td><b>...4712</b></td><td><b>DD Oldboy n.s.</b></td><td><b>3</b></td><td><b>9.8</b></td><td><b>WHITE</b></td><td><b>B</b></td></tr>
          </table>
          <div style="font-size:9px; color:#aaa; margin-top:6px;">4.712 copie totali · 1.247 oggi</div>
        </div>
      </div>
    </div>

    <div>
      <div class="card-label yellow">Export</div>
      <div class="card-title">Foglio Excel</div>
      <div class="ds-card">
        <div class="ds-header excel">📄 EGC_Grading_2026.xlsx</div>
        <div class="ds-body">
          <div class="ds-excel-bar">
            <div class="col-head">A</div>
            <div class="col-head">B</div>
            <div class="col-head">C</div>
            <div class="col-head">D</div>
            <div class="col-head">E</div>
            <div class="col-head">F</div>
          </div>
          <div class="ds-excel-row">
            <div class="cell" style="font-weight:600; background:#f0f0f0;">ID</div>
            <div class="cell" style="font-weight:600; background:#f0f0f0;">Titolo</div>
            <div class="cell" style="font-weight:600; background:#f0f0f0;">N°</div>
            <div class="cell" style="font-weight:600; background:#f0f0f0;">Voto</div>
            <div class="cell" style="font-weight:600; background:#f0f0f0;">Pagine</div>
            <div class="cell" style="font-weight:600; background:#f0f0f0;">Data</div>
          </div>
          <div class="ds-excel-row">
            <div class="cell">...4710</div>
            <div class="cell">One Piece</div>
            <div class="cell">108</div>
            <div class="cell">9.6</div>
            <div class="cell">WHITE</div>
            <div class="cell">02/06</div>
          </div>
          <div class="ds-excel-row">
            <div class="cell">...4711</div>
            <div class="cell">Dylan Dog</div>
            <div class="cell">468</div>
            <div class="cell">8.0</div>
            <div class="cell">CREAM</div>
            <div class="cell">02/06</div>
          </div>
          <div class="ds-excel-row hl">
            <div class="cell"><b>...4712</b></div>
            <div class="cell"><b>DD Oldboy</b></div>
            <div class="cell"><b>3</b></div>
            <div class="cell"><b>9.8</b></div>
            <div class="cell"><b>WHITE</b></div>
            <div class="cell"><b>02/06</b></div>
          </div>
          <div style="font-size:9px; color:#aaa; margin-top:6px;">Generato automaticamente · Aggiornato in tempo reale</div>
        </div>
      </div>
    </div>

  </div>

</div>
`;
