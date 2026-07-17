const infile = document.getElementById("fileinput");
const tagsl = document.getElementById("taglist");
const showbutton = document.getElementById("showselected");
const output = document.getElementById("output");
const allrows = [];
const tables = [];
const pendingUploads = [];
const combinedtags = new Set();
let currentrow = null;





const deleteGroup =document.getElementById("deleteGroup");
const deleteDate= document.getElementById("deleteDate");
const deleteSelectedGroupFiles= document.getElementById("deleteSelectedGroupFiles");
const selectAllDeleteGroup = document.getElementById("selectAllDeleteGroup");
const deleteGroupList = document.getElementById("deleteGroupList");
const loadDeleteByGroup= document.getElementById("loadDeleteByGroup");
const searchGroup = document.getElementById("searchGroup");
const searchResult = document.getElementById("searchResult");
const searchDate = document.getElementById("searchDate");
const searchFiles = document.getElementById("searchFiles");
const dateinput = document.getElementById("filedate");
const groupselect = document.getElementById("fileGroup");
const editmodel = document.getElementById("editmodel");
const editfields = document.getElementById("editfields");
const saveEdits = document.getElementById("saveEdits");
const cancelEdits = document.getElementById("cancelEdits");
const deletefiles = document.getElementById("deletefiles");
const deletefilelist = document.getElementById("deletefilelist");
const searchdeletefile = document.getElementById("searchdeletefile");
const loaddeletefile = document.getElementById("loaddeletefile");
const selectallfiles = document.getElementById("selectallfiles");
const searchdbfile = document.getElementById("searchdbfile");
const dbfilelist= document.getElementById("dbfilelist");
const loaddbfiles = document.getElementById("loaddbfiles");
const uploadtoDB = document.getElementById("uploadtoDB");
const showdbdata = document.getElementById("showdbdata");
const showalldb = document.getElementById("showalldb");
const dbtaglist = document.getElementById("dbtaglist");
const showdbcolumn = document.getElementById("showdbcolm");
const removeTable = document.getElementById("removeTable")
const clearalltables = document.getElementById("clearalltables");
const selectalltables = document.getElementById("selectalltables");
const searchName = document.getElementById("searchName");
// const deleteselected = document.getElementById("deleteselected");
// const renamebutton = document.getElementById("renamebutton");
const selectall = document.getElementById("selectall");
const clearall = document.getElementById("clearall");

const filefilter = document.getElementById("filefilter");

// const combineTablesBtn = document.getElementById("combineTables");
//calander for selecting date
dateinput.value=new Date().toISOString().split("T")[0];

//alphabets, options for selectgroup
for(let i=65; i<= 90;i++){
    const letter = String.fromCharCode(i);

    const option1 = document.createElement("option");
    option1.value = letter;
    option1.textContent = letter;
    groupselect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = letter;
    option2.textContent = letter;
    searchGroup.appendChild(option2);


    const deleteOption = document.createElement("option");
    deleteOption.value = letter;
    deleteOption.textContent = letter;
    deleteGroup.appendChild(deleteOption);
}



async function savefiletoserver(filename, Group, filedate) {
    const response= await fetch(
        "http://localhost:3000/files",
        {
            method: "POST",
            headers: {
                "content-type":"application/json",
            },
            body:JSON.stringify({
                filename,
                Group,
                filedate
            })

        }
    );
    return await response.json();
}

// calling columns from database and showing them
async function loadDBcolumn() {
    const response = 
    await fetch ("http://localhost:3000/waypoints/columns",{
        method:"POST"
     });
    const columns = await response.json();
    dbtaglist.innerHTML = "";
    for (const column of columns){
        const checkbox= document.createElement("input");
        checkbox.type ="checkbox";
        checkbox.value = column.column_name;

        const label = document.createElement("label");
        label.textContent = column.column_name;
        
        dbtaglist.appendChild(checkbox);
        dbtaglist.appendChild(label);
        dbtaglist.appendChild(document.createElement("br"));
    }
}

// showcolumn
showdbcolumn.addEventListener( "click", loadDBcolumn);

// show all data in the waypoint table in db
showalldb.addEventListener("click", async() => {
    const response = await fetch(
        "http://localhost:3000/waypoints", {
            method:"POST"
        });
    const rows = await response.json();
    if (rows.length === 0){
        alert("No DATA Available!");
        return;
    }
    const columns = Object.keys(rows[0]);

    renderTable(
        rows,
        columns
    )
})

//taking selected columns from db
function getSelecteddbColumns(){
    const selected = [];
    const boxes = dbtaglist.querySelectorAll('input[type="checkbox"]');

    for (const box of boxes){
        if (box.checked) {
            console.log(box.checked);
            selected.push(box.value);
        }
    }
    return selected;
}

showdbdata.addEventListener("click",async() =>{
    const selectedColumns = getSelecteddbColumns();
    if( selectedColumns.length ===0){
        alert("Select Atleast One choice/column")
        return;
    }
    const response = await fetch(
        "http://localhost:3000/waypoint/selected",{
            method:"POST",
            headers:{
                "content-type": "application/json"
            },
            body: JSON.stringify({
                columns: selectedColumns
            })
        }
    );
    const rows = await response.json();
    renderTable(
        rows,
        selectedColumns
    )
});

// Parses XML text into an XML document object
function parserXML(content){
    const parser = new DOMParser();
    return parser.parseFromString(content, "text/xml");
}

// Collects all unique tag names from the XML document
// and adds custom fields (filename, lat, lon)
function getalltags(doc){
    const alltags = new Set();

    const all = doc.getElementsByTagName("*");

    // Loop through every element in the XML
    for (const Elements of all) {
        alltags.add(Elements.tagName);
    }

    // Add extra fields that are not XML tags
    alltags.add("filename");
    alltags.add("lat");
    alltags.add("lon");

    return alltags;
}

// Converts a single waypoint (<wpt>) element into a row object
function waypointToRow(wpt, fileName){
    const row = {
        lat: wpt.getAttribute("lat"),
        lon: wpt.getAttribute("lon"),
        filename: fileName,

        // Example of manual mapping:
        // ele: AllWpts.children[0].textContent ,
        // time: AllWpts.children[1].textContent,
        // name: AllWpts.children[2].textContent,
        // sym: AllWpts.children[3].textContent
    };

    // Add all child tags and their values to the row object
    for (const child of wpt.children) {
        row[child.tagName] = child.textContent;
    }

    return row;
}

// Extracts all waypoint rows from an XML document
function getRows(doc, fileName){
    const rows = [];
    const allWpts = doc.getElementsByTagName("wpt");

    // Convert each waypoint into a row object
    for (const wpt of allWpts) {
        rows.push(
            waypointToRow(wpt, fileName)
        );
    }

    return rows;
}

// Creates a checkbox for every available tag/column
function createTagCheckboxes(tags) {
    tagsl.innerHTML = "";

    for (const tag of tags) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = tag;
        checkbox.value = tag;

        const label = document.createElement("label");
        label.htmlFor = tag;
        label.textContent = tag;

        tagsl.appendChild(checkbox);
        tagsl.appendChild(label);
        tagsl.appendChild(document.createElement("br"));
    }
}

// Returns an array of all currently selected column names
function getSelectedColumns(){
    const selected = [];
    const boxes = tagsl.querySelectorAll('input[type="checkbox"]');

    for (const box of boxes){
        if (box.checked) {
            console.log(box.checked);
            selected.push(box.value);
        }
    }

    return selected;
}

// Checks all column selection checkboxes
function selectAllCheckboxes(){
    const boxes = tagsl.querySelectorAll('input[type="checkbox"]');

    for (const box of boxes) {
        box.checked = true;
    }
}

// Unchecks all column selection checkboxes
function ClearAllCheckboxes(){
    const boxes = tagsl.querySelectorAll('input[type="checkbox"]');

    for (const box of boxes) {
        box.checked = false;
    }
}

// Renders a table using the supplied rows and selected columns
function renderTable(rows, selectedColumns) {

    const container = document.createElement("div");

    const table = document.createElement("table");
    const headerRow = document.createElement("tr");

    const indexHeader = document.createElement("th");
    indexHeader.textContent = "index";
    headerRow.appendChild(indexHeader);

    // output.innerHTML = "";


    table.appendChild(headerRow);

    // Create table headers
    for (const column of selectedColumns) {
        const th = document.createElement("th");
        th.textContent = column;
        headerRow.appendChild(th);
    }

    // Create table rows
    for (const [index, row] of rows.entries()) {
        const tr = document.createElement("tr");

        const indexTd = document.createElement("td");
        indexTd.textContent = index + 1;
        tr.appendChild(indexTd);

        for (const column of selectedColumns) {
            const td = document.createElement("td");
            td.textContent = row[column];
            tr.appendChild(td);
        }
        const editbtn = document.createElement("button");
        editbtn.textContent = "Edit";
        //edit button for table
        editbtn.addEventListener("click", () => {
           openEditor(row);
        });
        tr.appendChild(editbtn);

        table.appendChild(tr);
    }


    container.appendChild(table);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove Combined Table";

    removeBtn.addEventListener("click", () => {
        container.remove();
    });
    container.appendChild(removeBtn);

    output.appendChild(container);


}

// Creates a standalone table for a single uploaded file
// and returns its container along with its selection checkbox
function createtable(rows, fileName){
    const tableSelector = document.createElement("input");
    tableSelector.type = "checkbox";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove table";

    const container = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = fileName;

    container.appendChild(tableSelector);
    container.appendChild(title);

    const table = document.createElement("table");

    // Handle files with no waypoint data
    if (rows.length === 0) {
        return document.createTextNode(
            `${fileName} contains no waypoints`
        );
    }

    const columns = Object.keys(rows[0]);

    console.log(columns);

    const headerRow = document.createElement("tr");
    table.appendChild(headerRow);

    // Add index column header
    const indexHeader = document.createElement("th");
    indexHeader.textContent = "index";
    headerRow.appendChild(indexHeader);

    // Create column headers
    for (const column of columns) {
        const th = document.createElement("th");
        th.textContent = column;
        headerRow.appendChild(th);
    }

    // Create table rows with row numbering
    for (const [index, row] of rows.entries()) {
        const tr = document.createElement("tr");

        const indexTd = document.createElement("td");
        indexTd.textContent = index + 1;
        tr.appendChild(indexTd);

        for (const column of columns) {
            const td = document.createElement("td");
            td.textContent = row[column];
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    container.appendChild(table);
    container.appendChild(removeBtn);

    // Remove the table container when button is clicked
    removeBtn.addEventListener("click", () => {
    container.remove();

    const index = tables.findIndex(
        t => t.filename === fileName
    );

    if (index !== -1) {
        tables.splice(index, 1);
    }
});

    return {
        container,
        tableSelector,
        titleElement : title
    };
}

// Combines all checked tables into a single table view
// combineTablesBtn.addEventListener("click", () => {
//     const selectedRows = [];

//     // Gather rows from selected tables
//     for (const table of tables){
//         if(table.selector.checked){
//             selectedRows.push(...table.rows);
//         }
//     }

//     // Prevent combining if nothing is selected
//     if (selectedRows.length === 0) {
//         alert("Select atleast one table");
//         return;
//     }

//     // Build a complete list of unique columns
//     const selectedColumns =[ ... new Set (
//         selectedRows.flatMap(row => Object.keys(row))
//     )];

//     renderTable(
//         selectedRows,
//         selectedColumns
//     );

//     console.log(tables);
// });

//rename button
// renamebutton.addEventListener("click", () => {
//     const selectedtables = tables.filter(t => t.selector.checked);
//     if (selectedtables.length !== 1){
//         alert("select exactly one table");
//         return;
//     }
//     const newName = prompt("Enter new table name:");
//     if (!newName){
//         return; 
//     }
//         selectedtables[0].displayname = newName;
//         selectedtables[0].titleElement.textContent = newName;
// });

// delete button
// deleteselected.addEventListener("click", () => {
//     const selectedtables = tables.filter(
//         table => table.selector.checked
//     )
//     console.log(selectedtables);
//     for (const table of selectedtables) {
//         table.tableElement.remove();

//         const option = filefilter.querySelector(
//             `option[value = "${table.filename}"]`
//         );
//         if (option) {
//             option.remove();
//         }

//         for (const row of table.rows) {
//             const rowindex = allrows.indexOf(row);
//             if (rowindex !== -1) {
//                 allrows.splice(rowindex, 1);
//             }
//         }
//         const index = tables.indexOf(table);
//         if (index !== -1) {
//             tables.splice(index, 1);
//         }
//     }
// });



// search name
searchName.addEventListener("input", () => {
    output.innerHTML ="";

    const text = searchName.value.toLowerCase();
    const filterRows = allrows.filter(row =>
        Object.values(row).some(value => 
            String(value)
            .toLowerCase()
            .includes(text)
        )
    );
    const selectedcolumns = getSelectedColumns();
    if (selectedcolumns.length === 0){
        alert("Select at least one columns i.e. lat, lon, etc");
        return;
    }
    renderTable(
        filterRows,
        selectedcolumns
    )
});

// select all tables
selectalltables.addEventListener("click", () => {
    for (const table of tables ){
        table.selector.checked = true;
    }
});

//clearall Tables
clearalltables.addEventListener("click", () => {
    for (const table of tables){
        table.selector.checked = false;
    }
});

//remove Tables
removeTable.addEventListener("click", () =>{
    const selectedtables = tables.filter(
        table => table.selector.checked
    );
    for (const table of selectedtables){
        table.tableElement.style.display = "none";
    }
});

// save edit
saveEdits.addEventListener("click",async() => {
    const inputs = editfields.querySelectorAll("input");
    const updates ={};
    for(const input of inputs){
        const key = input.dataset.column;
            if(key ==="lat"|| key ==="lon"){
                // const num = parseFloat(input.value);
                updates[key]= parseFloat(input.value);

            } else {
                updates[key] = input.value;
            }    }
    if (currentrow.id){
        await fetch(
            `http://localhost:3000/waypoints/${currentrow.id}`,
            {method: "PUT",
                headers:{
                    "content-type":"application/json"
                },
                body : JSON.stringify({
                    updates
                })
            }
        );
    }
    Object.assign(currentrow,updates);
    editmodel.style.display ="none";
    alert (" updated");
});

//cancel edit
cancelEdits.addEventListener("click", () => {
    editmodel.style.display = "none";
});

//edit file values
function openEditor(row){
    
    currentrow = row;
    editfields.innerHTML = "";

    for(const[key,value] of Object.entries(row)){
        if(key ==="id" || key === "file_id"){
            continue;
        }
        const label = document.createElement("label");
        label.textContent = key;

        const input = document.createElement("input");
        input.value =value ??"";
        input.dataset.column = key;

        editfields.appendChild(label);
        editfields.appendChild(document.createElement("br"));
        editfields.appendChild(input);
        editfields.appendChild(document.createElement("br"));
    }
    editmodel.style.display="block";

}

function clearfrontend(){
    allrows.length= 0;
    tables.length= 0;

    pendingUploads.length=0;
    combinedtags.clear();
    output.innerHTML="";
    tagsl.innerHTML="";
    filefilter.innerHTML=
    '<option value = "all"> ALL Files</option>';
    infile.value="";
}





// Handles file uploads and processes GPX/XML files
infile.addEventListener("change", (event) => {
    if (tables.length > 0) {
    alert("Upload current file to DB or clear it first");
    infile.value = "";
    return;
}

    const selfile = event.target.files;

    if (!selfile) return;

    


    for (const file of selfile) {
        const reader = new FileReader();

        reader.onload = async(e) =>{
            // Parse uploaded file
            const doc = parserXML(e.target.result);

            // Gather tags from file
            const tags = getalltags(doc);

            // Merge tags into global tag collection
            for (const tag of tags) {
                combinedtags.add(tag);
            }

            // Refresh tag checkboxes
            createTagCheckboxes(combinedtags);

            // Extract waypoint rows
            const rows = getRows(doc , file.name);

            // adding files to array for uploading
            pendingUploads.push({
                filename : file.name,
                rows
            });


            const discoveredTags =[...tags].filter(
                tag => tag !== "filename" &&
                tag !== "lat" &&
                tag !== "lon"
            );

            await fetch(
                "http://localhost:3000/schema/sync",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        tags: discoveredTags
                })
                }
            );

                       

            // Add file to dropdown filter
            const option = document.createElement("option");
            option.value = file.name;
            option.textContent = file.name;

            filefilter.appendChild(option);

            // Create table for uploaded file
            const tableInfo = createtable(rows, file.name);
            output.appendChild(tableInfo.container);

            // Store table metadata
            tables.push({
                id: crypto.randomUUID(),
                filename: file.name,
                displayname: file.name,
                rows: rows,
                tableElement: tableInfo.container,
                selector: tableInfo.tableSelector,
                titleElement:tableInfo.titleElement,
                uploaddate: new Date()
            });
            

            // Add rows to master row collection
            allrows.push(...rows);

            console.log("Rows loaded:", allrows.length);
            console.table(rows);
        };

        reader.readAsText(file);
    }
});

//button to upload files to DB
uploadtoDB.addEventListener("click", async () => {
    try {
        for (const filedata of pendingUploads) {
            const check = await fetch(
                `http://localhost:3000/files/check/${filedata.filename}`
            );
            const result = await check.json();
            if (result.exists) {
                alert(`${filedata.filename} already exists`);
                continue;
            }
            const savedfile = await savefiletoserver(
                filedata.filename,
                groupselect.value,
                dateinput.value
            );
            // saving files to server
            const response = await fetch(
                "http://localhost:3000/waypoints/bulk",
                 {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    file_id: savedfile.file_id,
                    rows: filedata.rows
                })
            });
            const dbRowsResponse = await fetch(
                `http://localhost:3000/files/${savedfile.file_id}/waypoints`
            );
            const dbRows = await dbRowsResponse.json();

            const table = tables.find(
                t => t.filename === filedata.filename
            );
            if (table){
                table.rows =dbRows;
            }
            for (let i = allrows.length - 1; i >= 0; i--) {
                if (allrows[i].filename === filedata.filename) {
                    allrows.splice(i, 1);
                }
            }
            allrows.push(...dbRows);

            filedata.rows.length = 0;
            filedata.rows.push(...dbRows);

            if (!response.ok) {
                throw new Error(
                    `Failed to upload ${filedata.filename}`
                );
            }
        }
        alert("File uploaded!");
        clearfrontend()
    } catch (err) {
        console.error(err);
        alert("Upload failed!");
    }
});

//searchdbfile
searchdbfile.addEventListener("input", () =>{
    const text = searchdbfile.value.toLowerCase();

    const buttons = dbfilelist.querySelectorAll("button");
    for( const btn of buttons){
        btn.style.display = btn.textContent.
        toLowerCase().includes(text)
        ?"BLOCK":"none";
    }
});

function escapexml(str){
    return String (str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&apos;");
}


//recreating the xml/gpx file
async function filedownload(file_id) {
    const response = await fetch(
        `http://localhost:3000/files/${file_id}/download`
    );
    const data = await response.json();

    let xml =
        `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
`;
    for (const row of data.waypoints) {
        xml += `<wpt lat = "${Number(row.lat).toFixed(6)}" lon = "${Number(row.lon).toFixed(6)}">`;

        for (const [key, value] of Object.entries(row)) {
            if (value && !["id",
                "file_id",
                "lat","lon"].includes(key)) {
               xml += `<${key}>${escapexml(value)}</${key}>`;
            }
        }
        xml += `</wpt>`;

    }
    xml += `</gpx>`;

    const blob = new Blob([xml],
        { type: "application/xml" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download= data.file.file_name;

    a.click();
    URL.revokeObjectURL(url);
}


//loading existion files
loaddbfiles.addEventListener("click", async () => {
    const response = await fetch(
        "http://localhost:3000/dbfiles"
    );
    const files= await response.json();
    dbfilelist.innerHTML="";

    for(const file of files){
        const btn = document.createElement("button");
        btn.textContent = `${file.file_name}
        | Group ${file.group_name}
        | ${file.file_date}`;
        btn.addEventListener("click", () => filedownload(file.file_id));
        dbfilelist.appendChild(btn);
        dbfilelist.appendChild(document.createElement("br"));

    }
});


//searching files using date and group
searchFiles.addEventListener("click", async () => {
    const response= await fetch(
        "http://localhost:3000/files/search",
        {
            method:"POST",
            headers:{
                "content-type": "application/json"
            },
            body:JSON.stringify({
                Group:searchGroup.value,
                filedate:searchDate.value
            })
        }
    );
    const files = await response.json();
    searchResult.innerHTML= "";
    for (const file of files){
        const btn = document.createElement("button");
        btn.textContent =
        `${file.file_name}
        | Group ${file.group_name}
        | ${file.file_date}`;
        btn.addEventListener("click",()=>filedownload(
            file.file_id));
            searchResult.appendChild(btn);
            searchResult.appendChild(document.createElement("br"));

    }

});



// Deleting files from DB:
loaddeletefile.addEventListener("click", async () => {
    const response = await fetch(
        "http://localhost:3000/dbfiles"
    );
    const files = await response.json();
    deletefilelist.innerHTML = "";
    for (const file of files){
        const checkbox = document.createElement("input");
        checkbox.type= "checkbox";
        checkbox.value= file.file_id;
        const label = document.createElement("label");
        label.textContent= file.file_name;

        deletefilelist.appendChild(checkbox);
        deletefilelist.appendChild(label);
        deletefilelist.appendChild(document.createElement("br"));
    }

});

selectallfiles.addEventListener("click",()=>{
    const boxes = deletefilelist.querySelectorAll('input[type="checkbox"]');
    for (const box of boxes){
        box.checked= true;
    }
});

deletefiles.addEventListener("click", async () => {

    if(!confirm(
        "This action cannot be undone.\n\nDelete the selected file(s)?"
    )){
        return;
    }

   const boxes = deletefilelist.querySelectorAll(
    'input[type="checkbox"]'
);

let found = false;

for (const box of boxes) {

    if (!box.checked) continue;

    found = true;

    const response = await fetch(
        `http://localhost:3000/files/${box.value}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        alert("Delete failed");
        return;
    }
}

if (!found) {
    alert("Please select at least one file.");
    return;
}

alert("Files deleted.");
loaddeletefile.click();   // Refresh the list
});



//delete files using Goup and date
loadDeleteByGroup.addEventListener("click", async () => {

    const response = await fetch(
        "http://localhost:3000/files/delete-search",
        {
            method:"POST",
            headers:{
                "content-type":"application/json"
            },
            body:JSON.stringify({
                Group: deleteGroup.value,
                filedate: deleteDate.value
            })
        }
    );

    const files = await response.json();

    deleteGroupList.innerHTML = "";

    for(const file of files){

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = file.file_id;

        const label = document.createElement("label");
        label.textContent =
            `${file.file_name} | ${file.group_name} | ${file.file_date}`;

        deleteGroupList.appendChild(checkbox);
        deleteGroupList.appendChild(label);
        deleteGroupList.appendChild(document.createElement("br"));
    }

});

// select all button for group and date
selectAllDeleteGroup.addEventListener("click", () => {

    const boxes =
        deleteGroupList.querySelectorAll(
            'input[type="checkbox"]'
        );

    for(const box of boxes){
        box.checked = true;
    }

});

// delete using group and date
deleteSelectedGroupFiles.addEventListener("click", async () => {

    if(!confirm(
        "This action cannot be undone.\n\nDelete all selected files?"
    )){
        return;
    }

    const boxes =
        deleteGroupList.querySelectorAll(
            'input[type="checkbox"]'
        );

    let found = false;

    for(const box of boxes){

        if(!box.checked) continue;

        found = true;

        const response = await fetch(
            `http://localhost:3000/files/${box.value}`,
            {
                method:"DELETE"
            }
        );

        if(!response.ok){
            alert("Delete failed");
            return;
        }
    }

    if(!found){
        alert("Please select at least one file.");
        return;
    }

    alert("Selected files deleted.");

    loadDeleteByGroup.click();
});



// Displays all rows using the currently selected columns
showbutton.addEventListener("click", () => {
    const selectedColumns = getSelectedColumns();

    renderTable(
        allrows,
        selectedColumns,
    );
});

// Selects all tag checkboxes
selectall.addEventListener("click", () => {
    selectAllCheckboxes();
});

// Clears all tag checkboxes
clearall.addEventListener("click", () => {
    ClearAllCheckboxes();
});







