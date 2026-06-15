// STL.js Full Export
(function(){
  // --- Helpers ---
  function parseTable() {
    const table = document.querySelector("#dataTable table.htCore");
    if (!table) { console.warn("No dataTable found."); return []; }
    const rows = [];
    table.querySelectorAll("tbody tr").forEach(tr => {
      const cells = [];
      tr.querySelectorAll("td").forEach(td => {
        cells.push(td.textContent.trim());
      });
      rows.push(cells);
    });
    return rows;
  }

  function outputTable(arr) {
    const table = document.querySelector("#dataTable table.htCore");
    if (!table) { console.warn("No dataTable found."); return; }
    const trs = table.querySelectorAll("tbody tr");
    arr.forEach((row, i) => {
      if (trs[i]) {
        const tds = trs[i].querySelectorAll("td");
        row.forEach((val, j) => {
          if (tds[j]) tds[j].textContent = val;
        });
      }
    });
    console.log("%cHandsontable grid updated","color:orange;font-weight:bold;");
  }

  function renderTablePreview() {
    const rows = parseTable();
    if (!rows.length) { console.warn("No table data found."); return; }
    const blocks = rows.map(row => `
      <div class="row" style="display:grid;grid-template-columns:repeat(${row.length},1fr);gap:10px;margin-bottom:10px;">
        ${row.map(val => `
          <div class="cell" style="padding:15px;background:#3498db;color:#fff;border-radius:6px;text-align:center;">
            ${val || "&nbsp;"}
          </div>
        `).join("")}
      </div>
    `).join("");
    let preview = document.getElementById("async-preview");
    if (!preview) {
      preview = document.createElement("div");
      preview.id = "async-preview";
      document.body.appendChild(preview);
    }
    preview.innerHTML = `<h2>Handsontable Data Preview</h2>${blocks}`;
  }

  // --- STL Object ---
  window.STL = {
    expertMode: false,
    workflows: {},

    modifying: {
      remove_if: (arr,pred) => arr.filter(x=>!pred(x)),
      transform: (arr, fn) => arr.map(fn),
      concat: (arr, col1, col2, sep=" ") => {
        let newArr = [...arr];
        for (let index = 0; index < newArr.length; index++) {
          if (newArr[index][col1] && newArr[index][col2]) {
            const merged = newArr[index][col1] + sep + newArr[index][col2];
            // If col2+1 exists, overwrite; otherwise push new column
            if (typeof newArr[index][col2 + 1] !== "undefined") {
              newArr[index][col2 + 1] = merged;
            } else {
              newArr[index].push(merged);
            }
          }
        }
        return newArr;
      }
    },

    sorting: { sort: (arr, cmp=(a,b)=>a-b) => arr.sort(cmp) },

    parse: parseTable,
    output: outputTable,
    preview: renderTablePreview,

    defineWorkflow: function(name, steps){ this.workflows[name] = steps; },

    runWorkflow: function(name, options){
      let data = this.parse();
      if (!data.length) { console.warn("No table data found."); return; }
      let steps = this.workflows[name];
      if (!steps) { console.warn("Workflow not found."); return; }
      steps.forEach(fn => { data = fn(data, options); });
      this.output(data);
      this.preview();
    },

    // --- Export full STL.js again ---
    exportFullJS: function(){
      let workflowCode = "";
      for (const [name, steps] of Object.entries(this.workflows)) {
        workflowCode += `STL.defineWorkflow("${name}", [\n`;
        steps.forEach(fn => { workflowCode += `  ${fn.toString()},\n`; });
        workflowCode += `]);\n\n`;
      }

      const jsCode = `// STL.js Full Export\n\n` +
        `(function(){\n` +
        `  // --- Helpers ---\n` +
        `  ${parseTable.toString()}\n\n` +
        `  ${outputTable.toString()}\n\n` +
        `  ${renderTablePreview.toString()}\n\n` +
        `  // --- STL Object ---\n` +
        `  window.STL = ${JSON.stringify(this, null, 2)};\n` +
        `})();\n\n${workflowCode}`;

      const blob = new Blob([jsCode], {type: "application/javascript"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "STL_full.js";
      a.click();
      URL.revokeObjectURL(url);

      console.log("%cSTL.js exported as STL_full.js","color:green;font-weight:bold;");
    }
  };

  console.log("%cSTL.js Full Export loaded","color:yellow;font-weight:bold;");
})();

// Example workflows
STL.defineWorkflow("cleanAndSort", [
  d => STL.modifying.remove_if(d, r=>!r[0]),
  d => STL.sorting.sort(d, (a,b)=>a[0].localeCompare(b[0]))
]);

STL.defineWorkflow("mergevalues", [
  (d, options={col1:0, col2:1, sep:" "}) => {
    const modified = STL.modifying.concat(d, options.col1, options.col2, options.sep);
    STL.output(modified);
    return modified;
  }
]);
