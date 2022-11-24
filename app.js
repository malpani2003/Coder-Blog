const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
require("dotenv").config();
// var popupS = require('popups');

// console.log(process.env.SECRET_KEY)
const SaltRound =process.env.SALT_ROUND;
// console.log(SaltRound);

const storageConfig = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }

})
const upload = multer({ storage: storageConfig });
const app = express();


// const db = require("../Blog Website/data/database");

app.use(express.urlencoded({ extended: true })); // body parser
app.use(express.static("public")); // static files ke use ke liye
app.set("view engine", "ejs"); // ejs file ko render karne ke liye

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: process.env.SECRET_KEY,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use(cookieParser());

db_password=process.env.DB_PASS;
db_user_id=process.env.DB_ID;
const url = `mongodb+srv://${db_user_id}:${db_password}@blog.izk0v8w.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(url, function (err) {
    if (err) {
        console.log("DataBase is not Coonected");
    }
    else {
        console.log("Connected");
    }
});

const post_sechma = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    image_path: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: Array,
        required: true

    },
    Summary: {
        type: String,
        required: true
    },
    body: {
        type: String
        // required:true
    },
    date: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    author_id: {
        type: String
    },
    likes: {
        type: Number,
        default: 0
    },
});

// const comment_schema = new mongoose.Schema({
//     post_id: String,
//     name: String,
//     Comment: String
// });

const user_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    email_id: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    work: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        required: true,
    },
    likes_post: {
        type: Array
    }
})


const post = mongoose.model("post", post_sechma);
// const comments = mongoose.model("comments", comment_schema);
const user = mongoose.model("user", user_schema);
// post.createIndex({"createdAt": 1}, {epireAfterSeconds:60});

app.get("/", function (req, res) {
    res.render("index")
});
app.get("/create-post", function (req, res) {
    if (req.session.logiin) {
        user.find({ id: req.session.user_id }, function (err, result) {
            if (err) {
                res.render("404");

            }
            else {

                res.render("form", { name: result[0].name });
            }
        });
    }
    else {
        res.redirect("/login");
    }
});
app.get("/register", function (req, res) {
    res.render("register")
});
app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/see_post", function (req, res) {
    search_item = req.query.gsearch;

    if (search_item === undefined) {
        post.find(function (error, result) {
            if (error) {
                res.render("404");

            }
            else {
                if (result.length == 0) {

                    res.render("see_post", { post: result });
                }
                else {

                    res.render("see_post", { post: result});
                }
            }
        });
    }
    else {

        post.find({ body: { $regex: search_item } }, function (error, result) {
            if (error) {
                res.render("404");

            }
            else {
                console.log(result);
                if (result.length == 0) {
                    // res.render("404")
                    res.render("see_post", { post: result });
                }
                else {
                    res.render("see_post", { post: result,search_item:search_item });
                }
            }
        });
    }
});

app.get("/filter_search", function (req, res) {

    let search_item = req.query.search;
    let result = []
    post.find(function (err, docs) {
        if (err) {
            res.render("404");

        }
        else {

            docs.forEach(element => {
                if ((element.category).includes(search_item)) {
                    result.push(element);
                }
            });
            if (result.length == 0) {

                res.render("see_post", { post: result });
            }
            else {
                res.render("see_post", { post: result });
            }
        }
    });
});





app.get("/post/:id", function (req, res) {
    post_id = req.params.id;
    post.find({ id: post_id }, function (error, result) {
        if (error || result.length === 0) {
            res.render("404");

        }
        else {
            console.log(result);
            let creater_id = result[0].author_id;
            console.log(creater_id);
            user.find({ id: creater_id }, function (err, user_detail) {
                res.render("detail_post", { post: result, user_detail: user_detail[0] });
            });




        }

    });

});



app.get("/search_author/:name", function (req, res) {
    author_name = req.params.name;
    post.find({ author: author_name }, function (error, result) {
        if (error || result.length === 0) {
            res.render("404");

        }
        else {
            res.render("see_post", { post: result });


        }

    });

});




app.get("/post/edit/:id", function (req, res) {
    post_id = req.params.id;
    console.log(post_id);
    if (req.session.logiin) {

        post.find({ id: post_id }, function (error, result) {
            if (error || result.length === 0) {
                res.render("404");

            }
            else {
                let creater_id = result[0].author_id;
                console.log(creater_id)
                console.log(req.session.user_id)
                if (creater_id === req.session.user_id) {
                    res.render("edit_post", { post: result });
                }
                else {
                    res.send("Cannot Edit")
                }

            }

        });
    }
    else {
        res.redirect("/login")
    }

});

app.post("/edit-post/:id", function (req, res) {
    post_id = req.params.id;
    change_post = req.body;

    let today = new Date();
    today = today.toDateString();

    post.updateOne({ id: post_id }, { title: change_post.title, Summary: change_post.Summary, body: change_post.description, date: today, author: change_post.name }, function (err) {
        if (err) {
            res.render("404");

        }
        else {
            res.redirect(`/post/${post_id}`);
        }
    });
});

       
      
   



app.post("/create-post", upload.single("photo"), function (req, res) {

    let new_post = req.body;
    let path = req.file.filename;
    let array = ((req.body.Category).split(","));
    let category_array = [];
    array.forEach(element => {
        ele = element.trim();
        category_array.push(ele);
    });
    array.de
    console.log(path);
    let today = new Date();
    today = today.toDateString();
    console.log(new_post);

    const add_post = post({
        id: uuid.v4(),
        image_path: path,
        title: (new_post.title).trim(),
        category: category_array,
        Summary: (new_post.Summary).trim(),
        body: (new_post.description).trim(),
        date: today,
        author: (new_post.name).trim(),
        author_id: req.session.user_id
    });
    add_post.save(function (error, result) {
        if (error) {
            res.render("404");

        }
        else {
            res.redirect("/see_post");

        }
    });

});

// Delete Post 

app.get("/post/delete/:id", function (req, res) {
    let post_id = req.params.id;
    // sql = `DELETE FROM posts WHERE id=${post_id}`;
    if (req.session.logiin) {
        post.find({ id: post_id }, function (error, result) {
            if (error || result.length === 0) {
                res.render("404");

            }
            else {
                let creater_id = result[0].author_id;
                console.log(creater_id)
                console.log(req.session.user_id)
                if (creater_id === req.session.user_id) {
                    post.deleteOne({ id: post_id }, function (error) {
                        if (error) {
                            res.render("404");
                
                        }
                        else {
                
                            res.redirect("/see_post");
                        }
                    });
                }
                else {
                    res.send("Cannot Delete")
                }

            }

        });
    
}
else {
    res.redirect("/login")
}
});

app.get("/post/like/:id", function (req, rep) {
    let post_id = req.params.id;
    if (req.session.logiin) {
        // user_id
        user.find({ id: req.session.user_id }, function (err, user_detail) {
            if (err) {
                rep.render("404");
            }
            else {
                let post_likes = user_detail[0].likes_post;
                if (post_likes.includes(post_id)) {
                    rep.send("Already Liked");
                }
                else {
                    post_likes.push(post_id);
                    post.updateOne({ id: post_id }, { $inc: { likes: 1 } }, function (err) {
                        if (err) {
                            rep.render("404");

                        }
                        else {
                            user.updateOne({ id: req.session.user_id }, { likes_post: post_likes }, function (err) {
                                if (err) {
                                    rep.render("404");
                                }
                                else {
                                    rep.redirect(`/post/${post_id}`);
                                }
                            });
                        }
                    });


                }
            }
        });

    }
    else {
        rep.redirect("/login")
    }
});

// app.use("/uploadComment/:id", function (req, res) {
//     let where_comment = req.params.id;
//     let name = req.query.name;
//     let desc = req.query.description;
//     add_comment = new comments({
//         post_id: where_comment,
//         name: name,
//         Comment: desc
//     });
//     add_comment.save(function (error, result) {
//         if (error) {
//             res.render("404");

//         }
//         else {
//             res.redirect(`/post/${where_comment}`);

//         }
//     });

// });

app.post("/register", function (req, res) {
    // res.json(req.body);
    const user_password = req.body.Password;
    bcrypt.hash(user_password, SaltRound, function (err, hash_pass) {
        if (err) {
            res.render("404");

        }
        else {
            let user_hash_password = hash_pass;
            const new_user = user({
                id: uuid.v4(),
                name: req.body.name,
                email_id: req.body.email,
                password: user_hash_password,
                work: req.body.Occupation,
                about: req.body.About,
                likes_post: []
            });
            new_user.save(function (error, result) {
                if (error) {
                    // console.log(error);
                    res.render("Error", { error: error })
                }
                else {
                    res.redirect("/login");

                }
            })
        }
    });
});

app.post("/login", function (req, res) {
    //  res.json(req.body);
    let user_id = (req.body.email).trim();
    console.log(user_id);
    //  error=0
    let user_password = (req.body.Password).trim();
    user.find({ email_id: user_id }, function (err, result) {
        if (err) {
            res.render("404");

        }
        else {
            if (result.length >= 1) {
                hash_pass_store = result[0].password;
                // console.log(user_password,hash_pass_store);
                bcrypt.compare(user_password, hash_pass_store, function (err, message) {
                    // console.log(message);
                    if (err) {
                        res.render("404");

                    }
                    else if (message) {
                        req.session.user_id = result[0].id;
                        req.session.logiin = true;
                        // console.log(req.session.user_id)
                        // res.send(req.session.user_id);
                        res.render("index",{loginin:req.session.logiin});

                    }
                    else {
                        // popupS.alert({
                        //     content: 'Hello World!'
                        // });
                        res.render("login", { error: 1 });
                        // res.send("../Blog Website/try.js");
                    }
                });
            }
            else {
                // alert("Please Register");
                res.redirect("/register");
            }
        }
    })
});
app.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            res.render("404");

        }
        else {
            res.render("index",{loginin:false});

        }
    })
});
app.use(function (req, res) {
    res.render("404");
})




app.listen(3000, () => { console.log("Server is running at 3000....") });