 // 1) Replace these with your real values from Supabase Settings → API
    const SUPABASE_URL = "https://dxgdjabhxbupbjjmwglp.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z2RqYWJoeGJ1cGJqam13Z2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTc0MzMsImV4cCI6MjA3NjYzMzQzM30.rqk6mXUSpksgRaoFGlrWrZ9SQ8y-wAxJaeHiIplHnM4";

    // 2) Create client
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Helpers
    const setStatus = (msg) => document.getElementById("status").textContent = msg;

    function renderRows(tbody, rows, keys) {
      tbody.innerHTML = rows.map(r => {
        const tds = keys.map(k => `<td>${r[k] ?? ""}</td>`).join("");
        return `<tr>${tds}</tr>`;
      }).join("");
    }

    // Loaders
    async function loadChefs() {
      const { data, error } = await sb.from("chef").select("*").order("chefid", { ascending: true });
      if (error) return setStatus("chef error: " + error.message);
      renderRows(document.querySelector("#chefTable tbody"), data, ["chefid","name","station"]);
    }

    async function loadEntrees() {
      const { data, error } = await sb.from("entree").select("*").order("entreeid");
      if (error) return setStatus("entree error: " + error.message);
      renderRows(document.querySelector("#entreeTable tbody"), data, ["entreeid","name","price","chefid"]);
    }

    async function loadTables() {
      const { data, error } = await sb.from("diningtable").select("*").order("tableid");
      if (error) return setStatus("diningtable error: " + error.message);
      renderRows(document.querySelector("#tableTable tbody"), data, ["tableid","number","seats","status","serverid"]);
    }

    async function loadHosts() {
      const { data, error } = await sb.from("host").select("*").order("hostid");
      if (error) return setStatus("host error: " + error.message);
      renderRows(document.querySelector("#hostTable tbody"), data, ["hostid","name","contactinfo"]);
    }

    async function loadGuests() {
      const { data, error } = await sb.from("guestparty").select("*").order("partyid");
      if (error) return setStatus("guestparty error: " + error.message);
      renderRows(document.querySelector("#guestTable tbody"), data, ["partyid","guestcount","arrivedat","assignedtableid","seatedbyhostid"]);
    }

    async function loadReceipts() {
      const { data, error } = await sb.from("receipt").select("*").order("receiptid");
      if (error) return setStatus("receipt error: " + error.message);
      renderRows(document.querySelector("#receiptTable tbody"), data, ["receiptid","tableid","partyid","serverid","issuedat","totalamount","paymentstatus"]);
    }

    async function loadReceiptEntree() {
      const { data, error } = await sb.from("receipt_entree").select("*").order("receiptentid");
      if (error) return setStatus("receipt_entree error: " + error.message);
      renderRows(document.querySelector("#reTable tbody"), data, ["receiptentid","receiptid","entreeid","quantity","priceatorder","status"]);
    }

    async function loadServers() {
      const { data, error } = await sb.from("server").select("*").order("serverid");
      if (error) return setStatus("server error: " + error.message);
      renderRows(document.querySelector("#serverTable tbody"), data, ["serverid","name","contactinfo"]);
    }

    async function refreshAll() {
      setStatus("Loading…");
      await Promise.all([
        loadChefs(), loadEntrees(), loadTables(),
        loadHosts(), loadGuests(), loadReceipts(), loadReceiptEntree(),
        loadServers()
      ]);
      setStatus("Ready");
    }

    // Auto-assign chef based on entree name
    async function autoAssignChef(entreeName) {
      const { data: chefs, error } = await sb.from("chef").select("*");
      if (error) {
        setStatus("Error loading chefs: " + error.message);
        return null;
      }
      // Define simple mapping rules
      const lowerName = entreeName.toLowerCase();
      let station = null;
      if (lowerName.includes("steak") || lowerName.includes("chicken") || lowerName.includes("grill")) {
        station = "grill";
      } else if (lowerName.includes("cake") || lowerName.includes("cheesecake") || lowerName.includes("dessert") || lowerName.includes("pastry")) {
        station = "pastry";
      } else if (lowerName.includes("shrimp") || lowerName.includes("lobster") || lowerName.includes("clam") || lowerName.includes("seafood")) {
        station = "seafood";
      } else if (lowerName.includes("vegetable") || lowerName.includes("stir fry") || lowerName.includes("vegan") || lowerName.includes("salad")) {
        station = "vegetable";
      } else {
        station = "general";
      }
      // Find chef with matching station
      const matchedChef = chefs.find(c => c.station && c.station.toLowerCase() === station);
      if (matchedChef) return matchedChef.chefid;
      // If no exact match, fallback to first chef
      return chefs.length > 0 ? chefs[0].chefid : null;
    }

    // Update entreeChefId input when entreeName changes
    async function updateChefAssignment() {
      const entreeSelect = document.getElementById("entreeName");
      const chefInput = document.getElementById("entreeChefId");
      const selectedEntree = entreeSelect.value;
      const chefid = await autoAssignChef(selectedEntree);
      chefInput.value = chefid !== null ? chefid : "";
    }

    // Wire up events
    document.getElementById("refreshAll").addEventListener("click", refreshAll);
    document.getElementById("entreeName").addEventListener("change", updateChefAssignment);

    // Initial load
    refreshAll().then(updateChefAssignment);
  