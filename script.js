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
      await loadEntreeOptions();
    }

    async function loadEntreeOptions() {
      const { data, error } = await sb.from("entree").select("name").order("name");
      if (error) return setStatus("entree options error: " + error.message);
      const select = document.getElementById("entreeName");
      select.innerHTML = "";
      data.forEach(({ name }) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
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

    // Create (example): add chef
    async function addChef() {
      const name = document.getElementById("chefName").value.trim();
      const station = document.getElementById("chefStation").value.trim();
      if (!name) return setStatus("Enter a chef name");
      const { error } = await sb.from("chef").insert([{ name, station }]); // chefid auto-increments
      if (error) setStatus("insert error: " + error.message);
      else {
        document.getElementById("chefName").value = "";
        document.getElementById("chefStation").value = "";
        await loadChefs();
        setStatus("Chef added");
      }
    }

    // Add entree function
    async function addEntree() {
      const name = document.getElementById("entreeName").value;
      const price = parseFloat(document.getElementById("entreePrice").value);
      const chefid = parseInt(document.getElementById("entreeChefId").value);
      if (!name) return setStatus("Select an entree name");
      if (isNaN(price) || price <= 0) return setStatus("Enter a valid price");
      if (isNaN(chefid) || chefid <= 0) return setStatus("Enter a valid Chef ID");
      const { error } = await sb.from("entree").insert([{ name, price, chefid }]);
      if (error) setStatus("insert error: " + error.message);
      else {
        document.getElementById("entreePrice").value = "";
        document.getElementById("entreeChefId").value = "";
        await loadEntrees();
        setStatus("Entree added");
      }
    }

    // Wire up events
    document.getElementById("refreshAll").addEventListener("click", refreshAll);
    document.getElementById("addChef").addEventListener("click", addChef);
    document.getElementById("addEntree").addEventListener("click", addEntree);

    // Initial load
    refreshAll();