import { auth, db } from "./config.js"

import { watchAuthState, getPost, getfollowerAndfollowing, uploadProfileImage, getCurrentUser, updateUserDetails } from "./onAuthStateChange_Guard.js"

import { getDoc, getDocs, doc, collection, addDoc, deleteDoc, onSnapshot, setDoc, updateDoc, increment, query, where, limit } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


let dashboardUID = new URLSearchParams(window.location.search).get(`uid`)


const profileAvater=document.querySelector('.js-nav-avatar')


let currentUser;

//const profileLink=document.querySelector('.js-profile-link')

watchAuthState(
  async (user) => {
    currentUser = user
    document.querySelector('.js-new-post-btn').href=`write.html?uid=${currentUser.uid}`
    // username.textContent = `Hello! ${userName.userName}`
  },
  () => {
    console.log(`logout`)
  }
)

let user;
getCurrentUser(dashboardUID,(loginUser)=>{
user=loginUser
    profileAvater.src=user.user.profileImageUrl.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)
 document.querySelector('.js-total-followers').textContent=loginUser.user.followers
})

let allPost;

//get all post by the current user
async function allCurrentUserPost(callback) {
  let querys = query(collection(db, 'post'),
    where('authorId', `==`, dashboardUID))

  onSnapshot(querys, (snapshot) => {
    const post = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(post)
  })
}



allCurrentUserPost((post)=>{
  allPost=post
  // const Tab=document.querySelector('.js-dash-tab')
  // currentTab=Tab.dataset.tab
  
  if (allPost.length !== 0) {
    // filter by the condition given then display result
    applyFilter()
  }
})

const userAvaterbtn = document.querySelector('.js-user-avatar')
const profiledropdown = document.querySelector('.js-user-dropdown')
const linkToProfile=document.querySelector('.js-link-to-profile')

linkToProfile.addEventListener('click',()=>{
  linkToProfile.href=`profile.html?uid=${currentUser.uid}`
})

let click = false
userAvaterbtn.addEventListener('click', () => {
  if (!click) {
    profiledropdown.classList.remove('hidden')
    click = true
  } else {
    profiledropdown.classList.add('hidden')
    click = false
  }
})





const allpostcontainer=document.querySelector('.js-dash-posts-list')

//function to display post
function displayPost(Post) {
  let postcard = ''
  Post.forEach((post) => {
    postcard +=
      `
  <div class="dash-post-card" data-id="${post.id}">
  <!-- THUMBNAIL -->
  <img
    class="dash-post-thumb"
    src="${post.coverImageUrl ? post.coverImageUrl.replace('/upload/', `/upload/w_600,h_400,c_fill,g_auto/`) : ''}"
    alt="${post.title}"
    loading="lazy"
  />

  <!-- POST INFO -->
  <div class="dash-post-info">

    <div class="dash-post-category">${post.category}</div>

    <a href="post.html?id=${post.id}" class="dash-post-title">
      ${post.title}
    </a>

    <div class="dash-post-meta">
      <span class="dash-post-date">${post.createdAt}</span>
      <span class="dash-post-status status-${post.status}">
        ${post.status}
      </span>
    </div>

  </div>

  <!-- POST STATS -->
  <div class="dash-post-stats">
    <div class="dash-stat">👁 ${post.views}</div>
    <div class="dash-stat">${post.likes === 0 ? `🤍 ${post.likes}` : `❤️ ${post.likes}`}</div>
    <div class="dash-stat">💬 ${post.comments}</div>
  </div>

  <!-- POST ACTIONS -->
  <div class="dash-post-actions">
    <a
      href="write.html?id=${post.id}"
      class="dash-edit-btn"
    >
      ✏️ Edit
    </a>
    <button
      class="dash-delete-btn js-dash-delete"
      data-id="${post.id}"
    >
      🗑 Delete
    </button>
  </div>

</div>
    `
  })
allpostcontainer.innerHTML=postcard
}

const deletemodal=document.querySelector('.js-delete-modal')
const  cancelDeletebtn=document.querySelector('.js-cancel-delete')
const yesDeleteBtn=document.querySelector('.js-confirm-delete')


let deletepostid
allpostcontainer.addEventListener('click',(e)=>{
const deletepost=e.target.closest('.js-dash-delete')
if(!deletepost)return
deletepostid=deletepost.dataset.id
 deletemodal.classList.remove('hidden')
})

cancelDeletebtn.addEventListener('click', () => {
  deletemodal.classList.add('hidden')
})

yesDeleteBtn.addEventListener('click', () => {
 deletemodal.classList.add('hidden')
  deletePost()
})

 
async function deletePost() {
  await deleteDoc(doc(db, 'post', deletepostid))
  applyFilter()
}




const noResult=document.querySelector('.js-dash-no-results')

let currentSearch = ''
let currentTab = `publish`
let sortSearch = 'latest'

function applyFilter() {
  let filtered =  allPost
  if (currentTab === `publish`) {
    filtered = filtered.filter((post) => {
      return post.status === currentTab 
    })
  }else{
     filtered = filtered.filter((post) => {
      return post.status === currentTab 
    })
  }


  if (currentSearch !== '') {
    const search = currentSearch
    filtered = filtered.filter((post) => {
      return (
        post.title.toLocaleLowerCase().includes(search) ||
        post.excerpt.toLocaleLowerCase().includes(search) ||
        post.authorName.toLocaleLowerCase().includes(search) ||
        post.tags.some(tag => tag.toLocaleLowerCase().includes(search))
      )
    })
  }

  if (sortSearch === `latest`) {
    filtered = filtered.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }
  else if (sortSearch === `popular`) {
    filtered = filtered.sort((a, b) => {
      return b.likes - a.likes
    })
  }
  else if (sortSearch === `oldest`) {
    filtered = filtered.sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }else if(sortSearch === `views`){
      filtered = filtered.sort((a, b) => {
      return b.views - a.views
    })
  }



  if (filtered.length === 0) {
    allpostcontainer.innerHTML = ''
    noResult.classList.remove('hidden')
  } else {
    noResult.classList.add('hidden')
     calculateEngagement(allPost)
    displayPost(filtered)
    document.querySelector('.js-total-posts').textContent=allPost.length
  }

}


function calculateEngagement(post){
  const totalViews=post.reduce((accum,view)=>{
   const total=accum + view.views
   return total
  },0)
  
  document.querySelector('.js-total-views').textContent=totalViews

  const totalLike=post.reduce((accum,like)=>{
    const total=accum + like.likes
   return total
  },0)

 document.querySelector('.js-total-likes').textContent=totalLike

  const totalcomment=post.reduce((accum,comment)=>{
    const total=accum + comment.comments
   return total
  },0)

document.querySelector('.js-total-comments').textContent=totalcomment

}


function totalFollower(){

}

const sectionTab=document.querySelectorAll('.js-dash-tab')

sectionTab.forEach((tab)=>{

tab.addEventListener('click',()=>{
  sectionTab.forEach((tab)=>{
    tab.classList.remove(`active`)
  })
  tab.classList.add(`active`)
  const tabType=tab.dataset.tab 
  currentTab=tabType
  applyFilter()
})
})

const searchInput = document.querySelector('.js-dash-search')
searchInput.addEventListener('input',()=>{
   currentSearch = searchInput.value.trim().toLocaleLowerCase()
  applyFilter()
})


const sort_btn=document.querySelector('.js-dash-sort')
sort_btn.addEventListener('change', () => {
  sortSearch = sort_btn.value
  console.log(sortSearch)
  applyFilter()
})
