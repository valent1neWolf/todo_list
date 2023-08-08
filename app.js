//jshint esversion:6
const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
var _ = require('lodash');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongoURL = 'mongodb+srv://admin-vw:KRtMh0JoD9HfO5My@cluster0.pwdivou.mongodb.net/todolistDB';
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  }

});
const Item = mongoose.model('Item',itemSchema);


const item1 = new Item ({
  name :"Wake up"
});

const item2 = new Item ({
  name :"Brush my teeth"
});

const item3 = new Item ({
  name :"Drink coffee"
});

const defaultItems = [item1,item2,item3];

// Item.insertMany(defaultItems)
// .then(function(){
//   console.log("Successfully saved into our DB.");
// })
// .catch(function(err){
//   console.log(err);
// });

const listSchema = {
  name: String,
  items: [itemSchema]
} 

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

const day = date.getDate();
Item.find({})
.then(function(foundItems) {
   // console.log(foundItems);
    if(foundItems.length === 0){
        
        Item.insertMany(defaultItems)
        .then(function() {
            console.log("Insert succesfull");
        })
        .catch(function(err) {
            console.log(err);
        });
        res.redirect("/");

    }else{
      
        res.render("list.ejs", {listTitle: "Today", newListItems: foundItems});
    }

})
.catch(function(err) {
    console.log(err);
});
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
 const item = new Item ({
  name:itemName
 });
  if (listName == "Today" ) {
    item.save();    //valamikor múködik,valamikor nem
    console.log(`A new item has been added to the main page by the name of: ${item.name}.`);
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(function(foundList) {
      foundList.items.push(item);       //lényegében,mint a mongo-ban csak itt a foundList a db, az items a collection
      foundList.save();
      console.log(`A new item has been added to a list called: ${listName}.`);
      res.redirect("/" + listName);
  })
  .catch(function(err) {
      console.log(err);
  });
  }


});


app.post("/delete", function (req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(function() {
      console.log(`The item by id:${checkedItemId} was deleted succesfully`);
  })
    .catch(function(err) {
      console.log(err);
  });
  res.redirect("/");
}else{
//ha nem "today" megkeressük az adott listát a neve alapján, aztán megpróbáljuk kihúzni az items array-jéből az adott id-jű listaelemet,ami a checkboxhoz van rendelve 
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}} )  
  .then(function() {
    console.log(`The item by id:${checkedItemId} was deleted succesfully from the list called: ${listName}`);
    res.redirect("/" + listName);
})
.catch(function(err) {
    console.log(err);
});

}
})

app.get("/:topic",function (req,res) {
 
  const requestTitle = _.capitalize(req.params.topic); //első betű nagy, többi kicsi
  
  List.findOne({name: requestTitle})
  .then(function(foundLists) {
    if(foundLists){
        res.render("list.ejs",{listTitle: foundLists.name, newListItems: foundLists.items})
    }else{ 
        console.log("This list item doesn't eists yet.");
        const list = new List ({
          name:requestTitle,
          items: defaultItems
        });
    list.save();  
    res.redirect("/" + requestTitle);
    }
})
.catch(function(err) {
    console.log(err);
});





});

app.get("/about", function(req, res){
  res.render("about.ejs");
});

app.listen(process.env.PORT || 3000, function () {
	console.log("Server started on port 3000");
});
