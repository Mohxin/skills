import { strFromU8, unzipSync } from 'fflate';
import readXlsxFile from 'read-excel-file/browser';

const DATE_COLUMNS = ['transaktionsdatum', 'bokforingsdag', 'bokfordatum', 'reskontradatum', 'valutadatum', 'datum', 'date'];
const PAYEE_COLUMNS = ['transaktionstext', 'beskrivning', 'description', 'merchant', 'mottagare', 'avsandare', 'payee', 'namn', 'text'];
const MEMO_COLUMNS = ['egenanteckning', 'verifikationsnummer', 'meddelande', 'message', 'referens', 'reference', 'kommentar', 'memo', 'note'];
const AMOUNT_COLUMNS = ['bokfortbelopp', 'transaktionsbelopp', 'amount', 'belopp', 'summa'];
const DEBIT_COLUMNS = ['debitering', 'withdrawal', 'uttag', 'debet', 'debit'];
const CREDIT_COLUMNS = ['insattning', 'deposit', 'kredit', 'credit'];

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

const hasCandidate = (values, candidates) => {
  const normalizedValues = values.map(normalizeText).filter(Boolean);
  return candidates.some((candidate) => normalizedValues.some((value) => value.includes(candidate)));
};

const findColumn = (row, candidates) => {
  const keys = Object.keys(row);
  return candidates.reduce((match, candidate) => (
    match || keys.find((key) => normalizeText(key).includes(candidate))
  ), '');
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  const text = String(value || '').trim();
  const negativeByParentheses = /^\(.*\)$/.test(text);
  const cleaned = text
    .replace(/\s/g, '')
    .replace(/sek|kr/gi, '')
    .replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;
  const decimal = cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const parsed = Number(decimal) || 0;
  return negativeByParentheses ? -Math.abs(parsed) : parsed;
};

const parseDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split('T')[0];
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
  }
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().split('T')[0];
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
};

const parseDelimitedText = (text) => {
  const delimiter = text.includes(';') && !text.includes(',') ? ';' : ',';
  const rows = [];
  let cell = '';
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
};

const parseCellRef = (cellRef) => {
  const match = String(cellRef || '').match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 1, column: 1 };
  const [, letters, row] = match;
  const column = letters.toUpperCase().split('').reduce((total, letter) => (
    total * 26 + letter.charCodeAt(0) - 64
  ), 0);
  return { row: Number(row), column };
};

const getChildText = (node, tagName) => {
  const nodes = node.getElementsByTagName(tagName);
  return nodes[0]?.textContent ?? '';
};

const getInlineString = (cell) => {
  const inlineString = cell.getElementsByTagName('is')[0];
  return inlineString ? getChildText(inlineString, 't') : '';
};

const parseSharedStrings = (xml, parser) => {
  if (!xml) return [];
  const document = parser.parseFromString(xml, 'text/xml');
  return Array.from(document.getElementsByTagName('si')).map((item) => (
    Array.from(item.getElementsByTagName('t')).map((node) => node.textContent || '').join('')
  ));
};

const parseSheetXml = (xml, sharedStrings = []) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'text/xml');
  const rows = [];

  Array.from(document.getElementsByTagName('row')).forEach((rowNode) => {
    const row = [];
    Array.from(rowNode.getElementsByTagName('c')).forEach((cell) => {
      const { column } = parseCellRef(cell.getAttribute('r'));
      const type = cell.getAttribute('t');
      const value = getChildText(cell, 'v');
      let parsed = value;
      if (type === 'inlineStr') parsed = getInlineString(cell);
      else if (type === 's') parsed = sharedStrings[Number(value)] || '';
      else if (value !== '') parsed = Number.isNaN(Number(value)) ? value : Number(value);
      row[column - 1] = parsed;
    });
    if (row.some((value) => String(value ?? '').trim())) rows.push(row);
  });

  return rows;
};

export const readXlsxRowsFromArrayBuffer = (arrayBuffer) => {
  const files = unzipSync(new Uint8Array(arrayBuffer));
  const sheetXml = files['xl/worksheets/sheet1.xml'];
  if (!sheetXml) return [];
  const parser = new DOMParser();
  const sharedStrings = parseSharedStrings(files['xl/sharedStrings.xml'] ? strFromU8(files['xl/sharedStrings.xml']) : '', parser);
  return parseSheetXml(strFromU8(sheetXml), sharedStrings);
};

const rowHasContent = (row) => row.some((value) => String(value ?? '').trim());

const looksLikeTransactionHeader = (row) => {
  const cells = row.map((value) => String(value ?? ''));
  const hasDate = hasCandidate(cells, DATE_COLUMNS);
  const hasPayee = hasCandidate(cells, PAYEE_COLUMNS);
  const hasAmount = hasCandidate(cells, AMOUNT_COLUMNS)
    || (hasCandidate(cells, DEBIT_COLUMNS) && hasCandidate(cells, CREDIT_COLUMNS));
  return hasDate && hasAmount && hasPayee;
};

const findHeaderRowIndex = (rows) => {
  const exactIndex = rows.findIndex(looksLikeTransactionHeader);
  if (exactIndex >= 0) return exactIndex;
  const fallbackIndex = rows.findIndex(rowHasContent);
  return fallbackIndex >= 0 ? fallbackIndex : 0;
};

export const rowsToObjects = (rows) => {
  if (!rows.length) return [];
  const headerIndex = findHeaderRowIndex(rows);
  const headers = rows[headerIndex] || [];
  return rows.slice(headerIndex + 1).filter(rowHasContent).map((row) => headers.reduce((object, header, index) => {
    object[String(header || `Column ${index + 1}`).trim()] = row[index] ?? '';
    return object;
  }, {}));
};

export const normalizeImportedRows = (rows) => {
  if (!rows.length) return [];
  const sample = rows[0];
  const dateKey = findColumn(sample, DATE_COLUMNS);
  const payeeKey = findColumn(sample, PAYEE_COLUMNS);
  const memoKey = findColumn(sample, MEMO_COLUMNS);
  const amountKey = findColumn(sample, AMOUNT_COLUMNS);
  const debitKey = findColumn(sample, DEBIT_COLUMNS);
  const creditKey = findColumn(sample, CREDIT_COLUMNS);

  return rows.map((row) => {
    const debit = debitKey ? Math.abs(parseNumber(row[debitKey])) : 0;
    const credit = creditKey ? Math.abs(parseNumber(row[creditKey])) : 0;
    const amount = amountKey ? parseNumber(row[amountKey]) : credit - debit;
    return {
      date: parseDate(row[dateKey]),
      payee: String(row[payeeKey] || 'Imported transaction').trim(),
      memo: String(row[memoKey] || '').trim(),
      amount,
      cleared: true,
      source: row,
    };
  }).filter((row) => row.date && row.amount);
};

const hasUsableTable = (rows) => rows.length > 1 && findHeaderRowIndex(rows) < rows.length - 1;

const readWorkbookRows = async (file) => {
  const regularRows = await readXlsxFile(file);
  if (hasUsableTable(regularRows)) return regularRows;
  const fallbackRows = readXlsxRowsFromArrayBuffer(await file.arrayBuffer());
  return fallbackRows.length > regularRows.length ? fallbackRows : regularRows;
};

export const readImportRows = async (file) => {
  const isDelimited = /\.(csv|txt)$/i.test(file.name);
  const rawRows = isDelimited ? parseDelimitedText(await file.text()) : await readWorkbookRows(file);
  return normalizeImportedRows(rowsToObjects(rawRows)).slice(0, 500);
};
