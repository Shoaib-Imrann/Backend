const express = require('express');
const app = express();

const userModel = require('./models/user')
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const upload = require('./config/multerconfig');

app.set("view engine", 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res)=>{
    res.render("index");
});

app.get('/profilepic', (req,res)=>{
    res.render("profilepic");
});

app.post('/upload', isLoggedIn, upload.single("image"), async (req,res)=>{
   let user = await userModel.findOne({email:req.user.email});
   user.profilepic = req.file.filename;
   await user.save();
   res.redirect('/profile');
});

app.post('/register', async (req,res)=>{
    let {email, password, username, name, age} = req.body;
   
    let user = await userModel.findOne({email});
    if(user) {
        res.redirect('/login');
    } else{

    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password, salt, async (err, hash)=>{
           let user = await userModel.create({
                username,
                age,
                name,
                email,
                password: hash,
            });
            let token = jwt.sign({email:email, userid: user._id}, "shhhh");
            res.cookie("token", token);
            res.redirect("/profilepic");
        })
    })
}
});

app.get('/logout', (req,res)=>{
    res.cookie("token", "");
    res.redirect("/login");
});

app.get('/login', (req,res)=>{
    res.render("login");
});

app.post('/login', async (req,res)=>{
    let {email, password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.redirect('/');

    bcrypt.compare(password, user.password, (err,result)=>{
        if(result) {
            let token = jwt.sign({email:email, userid: user._id}, "shhhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
    });
});

app.get('/profile', isLoggedIn, async (req,res)=>{
   let user =  await userModel.findOne({email:req.user.email}).populate('posts')
    res.render("profile", {user});
});

// app.get('/like/:id', isLoggedIn, async (req,res)=>{
//     let post =  await postModel.findOne({_id: req.params.id}).populate('user')
    
//     if(post.likes.indexOf(req.user.userid) === -1){
//         post.likes.push(req.user.userid);
//     }
//     else{
//         post.likes.splice(post.likes.indexOf(req.user.userid), 1);
//     }
//     await post.save();
//     res.redirect("profile");
//  });

app.get('/edit/:id', isLoggedIn, async (req,res)=>{
    let post =  await postModel.findOne({_id: req.params.id}).populate('user')
    res.render("edit", {post});
 });

 app.post('/update/:id', isLoggedIn, async (req,res)=>{
    let post =  await postModel.findOneAndUpdate({_id: req.params.id}, {data: req.body.data})
    res.redirect("/profile");
 });

 app.post('/delete/:id', isLoggedIn, async (req, res) => {
    await postModel.findByIdAndDelete(req.params.id);
    res.redirect('/profile');
});



app.post('/post', isLoggedIn, async (req,res)=>{
    let user =  await userModel.findOne({email:req.user.email});
    let {data} = req.body;
    let createdpost = await postModel.create({user:user._id, data});
    user.posts.push(createdpost._id);
    await user.save();
    res.redirect('/profile')
 })

//middleware
function isLoggedIn(req, res, next){
    if(req.cookies.token === "") res.send("You must be logged in");
    else{
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }
}

app.listen(3000);