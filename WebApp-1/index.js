const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set("view engine", 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function(req, res){
    fs.readdir('./files', function(err, files){
        files = files.filter(file => file !== '.gitkeep');
        res.render("index", {files: files});
    })
});

app.get('/file/:filename', function(req, res){
    fs.readFile(`./files/${req.params.filename}`, "utf-8", function(err,filedata){
        res.render('details', {filename:req.params.filename,filedata:filedata});
    })
});

app.get('/edit/:filename', function(req, res){
    res.render('edit', {filename: req.params.filename})
});

app.post('/edit', function(req, res){
    fs.rename(`./files/${req.body.previous}`,`./files/${req.body.new}`, function(err){
        res.redirect('/');
    } )
})

app.post('/create', function(req, res){
    fs.writeFile(`./files/${req.body.title.split(' ').join('')}.txt`, req.body.description, function(err){
        res.redirect('/');
    });
})

app.post('/delete', function(req, res){
    const fileToDelete = `./files/${req.body.filename}`;
    fs.unlink(fileToDelete, function(err){
        if (err) {
            console.error('Error deleting file:', err);
        }
        res.redirect('/');
    });
});

app.listen(3000);
