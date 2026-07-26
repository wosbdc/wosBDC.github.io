const FIREBASE_URL = "https://wos-dashboard-38d4c-default-rtdb.firebaseio.com";
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxPlNaLMDn4LX7ZpbOc8O2VzQr055fnynJnyDinedM7stFe_PMdZWkpf8BMTrysH4U/exec';

async function main() {
  console.log("🔍 Fetching Google Sheet Showdown & Showdown History...");
  const [sdRes, sdHistRes] = await Promise.all([
    fetch(`${API_BASE_URL}?api=Showdown`).then(r => r.json()).catch(() => null),
    fetch(`${API_BASE_URL}?api=Showdown%20History`).then(r => r.json()).catch(() => null)
  ]);
  
  console.log("Showdown Sheet sample rows:", sdRes ? (sdRes.data || sdRes).slice(0, 15) : 'none');
  console.log("Showdown History Sheet sample rows:", sdHistRes ? (sdHistRes.data || sdHistRes).slice(0, 15) : 'none');
}

main().catch(console.error);
