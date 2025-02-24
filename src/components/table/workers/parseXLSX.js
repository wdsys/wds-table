import XLSX from 'xlsx-js-style';

async function onParseExcelFile(blob) {
  // const result = await client.parseExcelFile(blob);
  const data = await blob.arrayBuffer();
  const workbook = XLSX.read(data, {
    type: 'binary',
    cellDates: true,
  });
  const result = [];
  for (let i = 0; i < workbook.SheetNames.length; i += 1) {
    const sheetData = await XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[i]],
      { header: 1 },
    );
    result.push({ name: workbook.SheetNames[i], data: sheetData });
  }
  return result;
}

onmessage = async (event) => {
  const { data } = event;
  if (data.type === 'start') {
    const result = await onParseExcelFile(data.file);
    postMessage({
      type: 'finish',
      data: result,
    });
  }
};
