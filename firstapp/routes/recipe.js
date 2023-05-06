const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const Recipe = require("../models/Recipe");

isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


router.get('/recipe', isLoggedIn,
  async (req,res,next) => {
    res.render('recipe')
  }
)

router.post('/recipe',
  isLoggedIn,
  async (req,res,next) => {
    const type = req.body.type,
        preference = req.body.preference,
        restriction = req.body.restriction;
    let prompt = `I need a ${type} recipe. `
    if (preference === null) {
      prompt.concat("I don't have any preference. ")
    } else {
      prompt.concat(`My preference is ${preference}. `)
    }
    if (restriction === null) {
      prompt.concat("I don't have any restriction. ")
    } else {
      prompt.concat(`My restriction is ${restriction}. `)
    }
    prompt.concat(`Please just include only the name and content of the recipe in your response. Do not include any introducing or describing words or sentences such as "One easy and delicious main dish is ..."! `)
    try {
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 1024,
      });
      // res.json(completion.data)
      let result = completion.data.choices[0].text;
      // Deal with result string
      let splitStr = result.split('\n\n');
      const title = splitStr[1];
      let pos = result.indexOf(title) + title.length;
      const content = result.substring(pos + 1, result.length);
      let newRecipe = new Recipe({
        type: type,
        preference: preference,
        restriction: restriction,
        title: title,
        content: content,
        userId: req.user._id,
      });
      let newRecipeId = 0;
      await newRecipe.save()
                     .then((recipe) => {
                      newRecipeId = recipe._id;
                     })
      res.redirect(`/recipe/${newRecipeId}`)
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }
)

router.get('/recipe/index', isLoggedIn, 
  async (req,res,next) => {
    const sortBy = req.query.sortBy
    let recipes = []
    if (sortBy == 'createdDate') {
      recipes = await Recipe.find({userId: req.user._id})
                            .sort({createdDate:-1});
    } else if (sortBy == 'type') {
      recipes = await Recipe.find({userId: req.user._id})
                            .sort({type:1});
    } else {
      recipes = await Recipe.find({userId: req.user._id})
    }
    res.locals.recipes = recipes;
    res.render('recipeIndex')
  }
)

router.get('/recipe/delete/:id', isLoggedIn,
  async (req, res, next) => {
      await Recipe.deleteOne({_id:req.params.id});
      res.redirect('/recipe/index')
});

router.get('/recipe/:id', isLoggedIn, 
  async (req,res,next) => {
    res.locals.recipe = await Recipe.findById(req.params.id);
    res.render('recipeShow')
})



module.exports = router;