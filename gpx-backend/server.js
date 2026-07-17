const pool = require("./db");
// const { v4: uuidv4 } = require("uuid");

const express = require("express")
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json())

async function getExistingColumns() {
    const result = await pool.query(
        `SELECT column_name FROM 
        information_schema.columns
        WHERE table_name = 'waypoints'`
    );
    return result.rows.map(r => r.column_name);
}


//taking all selected tags from db for show selected columns
app.post("/waypoint/selected", async (req, res) => {
    try {
        const { columns } = req.body;
        const existingColumns = await getExistingColumns();

        const safeColumns =
            columns.filter(c => existingColumns.includes(c)
            );

        if (safeColumns.length === 0) {
            return res.status(400).json({
                error: "Invalid columns"
            });
        }


        const columnlist = safeColumns.map(col => `"${col}"`).join(",");

        const result = await pool.query(
            `SELECT ${columnlist} FROM waypoints`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR")
    }
})




app.post("/waypoints/columns", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT column_name
        FROM INFORMATION_schema.columns
        WHERE table_name = 'waypoints'`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});


app.post("/waypoints", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM waypoints"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});


async function addmissingcolumns(tags) {
    const existingColumns = new Set(
        (await getExistingColumns()).map(c => c.toLowerCase())
    );
    for (const tag of tags) {
        const col = tag.toLowerCase().trim();
        if (!existingColumns.has(col)) {
            await pool.query(
                `ALTER TABLE waypoints 
                ADD COLUMN "${col}" TEXT`
            );
            existingColumns.add(col);
            console.log(`ADDED COLUMN : ${col}`);
        }
    }
}


app.post("/schema/sync", async (req, res) => {
    try {
        const { tags } = req.body;
        await addmissingcolumns(tags);
        res.json({
            message: "schema updated"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "schema update failed"
        });
    }
});

// main page of server
app.get("/", (req, res) => {
    res.send("server working");
});

//adding file route
app.get("/files", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM FILES"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("DATABASE ERROR");
    }

});
app.post("/files", async (req, res) => {
    try {
        // const file_id = uuidv4();
        const {filename,
            Group,
            filedate
        }= req.body;

        const result = await pool.query(
            `INSERT INTO files 
        (file_name, upload_date,group_name,file_date)
        values($1,NOW(),$2,$3)
        RETURNING file_id`,
            [ filename, Group, filedate]
        );

        res.json({
            file_id:result.rows[0].file_id,
            filename: filename
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("DATABASE ERROR");
    }
});
// DB connection test
app.get("/testdb", async (req, res) => {
    try {
        const result =
            await pool.query("select Now()"
            );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

app.post("/waypoints/bulk", async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            file_id,
            rows
        } = req.body;

        await client.query("BEGIN");

        console.log(req.body);

        for (const row of rows) {

            // const id = uuidv4();

            const cleanedRow = {};

            for (const [key, value] of Object.entries(row)) {
                if (key !== "filename") {
                    cleanedRow[key.toLowerCase().trim()] = value;
                }
            }
            delete cleanedRow.filename;
            const columns = [
                "file_id",
                ...Object.keys(cleanedRow).map(c => `"${c}"`)
            ];
            const values = [
                file_id,
                ...Object.values(cleanedRow)
            ]
            const placeholder = values.map(
                (_, i) => `$${i + 1}`
            );
            const query = `
        INSERT INTO waypoints
        (${columns.join(",")})
        VALUES
        (${placeholder.join(",")})`;



            await client.query(
                query,
                values
            );
        }

        await client.query("COMMIT");

        res.json({
            message: "all waypoints saved",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).send("BULK save fail");
    } finally {
        client.release();

    }

});

//retieving files from DB 
app.get("/files/:fileId/download", async (req, res) => {
    try {
        const { fileId } = req.params;
        const fileResult = await pool.query(
            `SELECT * FROM files 
            WHERE file_id = $1`,
            [fileId]
        );
        const waypointResult = await pool.query(
            ` SELECT * FROM waypoints
            WHERE file_id = $1`,
            [fileId]
        );
        res.json({
            file: fileResult.rows[0],
            waypoints: waypointResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});

app.get("/dbfiles", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT file_id,
        file_name, upload_date,
        group_name, file_date
        FROM files 
        ORDER BY upload_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }

});

//deleting files from DB
app.delete("/files/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;

        const deleteWaypoints = await pool.query(
            `DELETE FROM waypoints
             WHERE file_id = $1
             RETURNING *`,
            [fileId]
        );

        console.log("Waypoints deleted:", deleteWaypoints.rowCount);

        const deleteFile = await pool.query(
            `DELETE FROM files
             WHERE file_id = $1
             RETURNING *`,
            [fileId]
        );

        console.log("Files deleted:", deleteFile.rowCount);

        // Check AFTER deleting the file
        const count = await pool.query(
            `SELECT COUNT(*) FROM files`
        );

        if (Number(count.rows[0].count) === 0) {
            await pool.query(`
                TRUNCATE TABLE waypoints, files
                RESTART IDENTITY CASCADE;
            `);

            console.log("All tables truncated.");
        }

        res.json({
            message: "Deleted"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});


//deleting using Group and Date
app.post("/files/delete-search", async (req, res) => {
    try {

        const { Group, filedate } = req.body;

        const result = await pool.query(
            `SELECT file_id,
                    file_name,
                    group_name,
                    file_date
             FROM files
             WHERE group_name = $1
             AND file_date = $2
             ORDER BY file_name`,
            [Group, filedate]
        );

        res.json(result.rows);

    } catch(err){
        console.error(err);
        res.status(500).send("ERROR");
    }
});

//avoiding duplication when uploading to DB
app.get("/files/check/:filename", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM files 
            where file_name = $1`,
            [req.params.filename]
        );
        res.json({
            exists: result.rows.length > 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});

app.put("/waypoints/:id", async (req,res) => {
    try{
        const {id} = req.params;
    const {
        updates
    }= req.body;
    const column = Object.keys(updates);
        const existingColumns =
            await getExistingColumns();
            if (column.length === 0) {
    return res.status(400).json({
        error:"No updates"
    });
}

        const safeColumns =
            column.filter(
                c => existingColumns.includes(c)
            );

        if (safeColumns.length === 0) {
            return res.status(400).json({
                error: "No valid columns"
            });
        }



        const sets = safeColumns.map(
            (col, index) =>
                `"${col}" = $${index + 1}`
        );

        const values = [
            ...safeColumns.map(col => updates[col]),
            id
        ];
        await pool.query(
            `UPDATE waypoints 
        set ${sets.join(",")}
        where id = $${safeColumns.length + 1}`,
            values
        );
        res.json({
            message: "updated"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }

});
app.get("/files/:fileId/waypoints", async (req,res) => {
    try{
        const result = await pool.query(
            `SELECT * FROM waypoints
             where file_id = $1`,
            [req.params.fileId]
        );
        res.json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).send("ERROR");
    }
});

app.post("/files/search", async (req,res) => {
    try{
        const {
            Group,
            filedate
        }=req.body;
        const result= await pool.query(
            `SELECT * from files
            WHERE group_name = $1
            AND file_date = $2`,
            [Group, filedate]
        );
        res.json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).send("ERROR");
    }
})










process.on("unhandledRejection", err => {
    console.error("Unhandled Rejection", err);
});

process.on("uncaughtException", err =>{
    console.error("Uncaught Exception", err);
});





app.listen(3000, () => {
    console.log("file running on port 3000");
});


