// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/** 
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    
    // 1) Get query from view
    const query = searchView.getInput();
    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearSearchRes();
        renderLoader(elements.searchRes);

        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert('Something wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});
elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearSearchRes();
        searchView.renderResults(state.search.result, goToPage);
    }
});


/** 
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // highlight selected search item
        if (state.search)searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);
 

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            // console.log(state.recipe);
            recipeView.renderRecipe(state.recipe,state.likes.isLiked(id));

        } catch (err) {
            console.log(err);
            alert('Error processing recipe!');
        }
    }
};
 
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/** 
 * LIST CONTROLLER
 */
const controlList = () =>{
    // Create a list if is none yet
    if (!state.list) state.list = new List ();

    // Add each ingredient to the list and UI
    listView.clearShoppingList();
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);

    });
};

// Haandle delete and update list item events
elements.shopping.addEventListener('click',e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        // Delete from state
        state.list.deleteItem(id);
        
        // Delete from UI
        listView.deleteItem(id);
    }
    // Handle the count update
    else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value,10);
        if(val >0 ) state.list.updateCount(id,val);
        
    }
});

/** 
 * LIKE CONTROLLER
 */

const controlLikes =() => {
    if(!state.likes) state.likes= new Likes();
    const currentID=state.recipe.id;

        // User has NOT liked the recipe
    if(!state.likes.isLiked(currentID)){
        // Add like to the state
        const newLike =state.likes.addLike(currentID,state.recipe.title,state.recipe.author,state.recipe.img);

        // toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to the UI
        likesView.rendorLike(newLike);

        // User HAS liked the recipe
    }else{
         // Remove like from the state
         state.likes.deleteLike(currentID);

        // toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from the UI
        console.log(state.likes);
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikMenu(state.likes.getNumLikes());
};

// Restore liked recipe on page load
window.addEventListener('load', ()=>{
    state.likes= new Likes();

    // restore likes
    state.likes.readStorage();

    // Toggle like menu button 
    likesView.toggleLikMenu(state.likes.getNumLikes());

    // Render existing likes
    state.likes.likes.forEach(like => likesView.rendorLike(like));
})

// Handling recipe button clicks
elements.recipe.addEventListener('click', e =>{
    if (e.target.matches('.btn-decrease , .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings>1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase , .btn-increase *')){
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } 
    // Add to shopping list button is clicked
    else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList();
    }
    // Heart button is clicked
    else if(e.target.matches('.recipe__love, .recipe__love *')){
        // Like controller
        controlLikes();
    }
});

