import { auth, db } from "./config.js"
import { signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { watchAuthState, getPost } from "./onAuthStateChange_Guard.js"
import { getDoc, getDocs, doc, collection, addDoc, updateDoc ,onSnapshot} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


let posts = [];
let currentUser;

// const signin_writing
const signoutBtn = document.querySelector('.js-signout-btn')
const userAvaterbtn = document.querySelector('.js-user-avatar')
const profiledropdown = document.querySelector('.js-user-dropdown')

// asking user whether they want to logout element
const areUsureBox = document.querySelector('.js-ask-user')
const Notsure = document.querySelector('.js-no-not-sure')
const yesSure = document.querySelector('.js-yes-sure')

const category = document.querySelector('.js-category-tabs')
const sort_btn = document.querySelector('.js-sort-select')

const logoutSpinner = document.querySelector('.js-logout-spinner')
const emptyPostAlert = document.querySelector('.js-posts-empty')



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


signoutBtn.addEventListener('click', () => {
  userAvaterbtn.disabled = true
  profiledropdown.classList.add('hidden')
  areUsureBox.classList.remove('hidden')
})

Notsure.addEventListener('click', () => {
  areUsureBox.classList.add('hidden')
  profiledropdown.classList.remove('hidden')
  userAvaterbtn.disabled = false
})

yesSure.addEventListener('click', () => {
  areUsureBox.classList.add('hidden')
  profiledropdown.classList.remove('hidden')
  logoutSpinner.classList.remove('hidden')
  signoutBtn.classList.add('hidden')
  userAvaterbtn.disabled = false

  setTimeout(() => {
    logOut()
  }, 3000)

})



async function logOut() {
  try {
    await signOut(auth)
    window.location.href = 'index.html'
  }
  catch (error) {
    console.log(error)
  }
}

//logout state
const navAuth = document.querySelector('.js-logged-out')

//login state
const navUser = document.querySelector('.js-logged-in ')
const username = document.querySelector('.js-username')

let  userTofollow;

getPost((post) => {
  let publish = post.filter(filtered => filtered.status === 'publish')
  posts = publish
  if (posts.length !== 0) {
    applyFilter()
  }
  displayAllpost(publish)
  trending()
})

const profileLink=document.querySelector('.js-profile-link')
const dashboardlink=document.querySelector('.js-dashboard-link')
watchAuthState(
  async (user) => {
    currentUser = user
    const userImage= await getUser(user)
    profleAvater.src=userImage.profileImageUrl.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)
     profileLink.href=`profile.html?uid=${user.uid}`
     dashboardlink.href=`dashboard.html?uid=${user.uid}`
    document.querySelector('.js-hero-cta').href = `write.html`
    navUser.classList.remove('hidden')
    navAuth.classList.add('hidden')

    const userName = await getUser(user)
    username.textContent = `Hello! ${userName.userName}`
  },
  () => {
     //profileLink.href=`profile.html?uid=${user.uid}`
    document.querySelector('.js-hero-cta').href = `auth.html?mode=signup`
    navUser.classList.add('hidden')
    navAuth.classList.remove('hidden')
  }
)

async function getUser(userid) {
  const user = await getDoc(doc(db, 'users', userid.uid))
  return user.data()
}


// async function getAllUser(){
//  const user= await getDocs(collection(db,'users'))
//   const allUser=user.docs.map((doc)=>{
//     return{
//       id:doc.id,
//       ...doc.data()
//     }
//   })
//   return allUser
// }

const profleAvater=document.querySelector('.js-nav-avatar')
const postCardDiv = document.querySelector('.js-posts-list')

async function displayAllpost(posts) {
  if (posts.length === 0) {
    postCardDiv.innerHTML = ''
    emptyPostAlert.classList.remove('hidden')
    if (currentUser) {
      document.querySelector('.js-empty-cta').href = `write.html`
    }
    return
  }
  emptyPostAlert.classList.add('hidden')
  let postCard = ''
  posts.forEach((post) => {
    postCard += `<div class="post-card" data-id="${post.id}">
            <div class="post-author-row">
              <img class="post-author-avatar" src="${post.authorAvater.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)}" alt="${post.authorName}" />
              <a href="profile.html?uid=${post.authorId}" class="post-author-name">
                ${post.authorName}
              </a>
              <span class="post-date">${post.createdAt}</span>
            </div>

            <div class="post-content">
              <div class="post-category">${post.category}</div>

              <a href="post.html?id=${post.id}" class="post-title">
                ${post.title}
              </a>

              <p class="post-excerpt">${post.excerpt}</p>

              <div class="post-footer">
                <span class="post-read-time">⏱ ${post.readTime} min read</span>
                <span class="post-likes"> ${post.likes === 0 ? `🤍 ${post.likes}` : `❤️ ${post.likes}`}</span>
                <span class="post-comments">💬 ${post.comments}</span>
              </div>
            </div>
           
            <a href="post.html?id=${post.id}" class="post-thumbnail-wrap">
              <img class="post-thumbnail" src="${post.coverImageUrl.replace('/upload/',`/upload/w_600,h_400,c_fill,g_auto/`)}" alt="coming soon" loading="lazy" />
            </a>

          </div>`
  })
  postCardDiv.innerHTML = postCard
}



// search logic
const noResult = document.querySelector('.js-no-results')
const searchInput = document.querySelector('.js-search-input')
const categorieBtn = document.querySelectorAll('.js-cat-btn')

let currentSearch = ''
let currentCategory = `all`
let sortSearch = 'latest'

function applyFilter() {
  let filtered = posts
  if (currentCategory !== `all`) {
    filtered = filtered.filter((post) => {
      return post.category === currentCategory
    })
  }


  if (currentSearch !== '') {
    const search = currentSearch
    console.log(search)
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
  }



  if (filtered.length === 0) {
    postCardDiv.innerHTML = ''
    noResult.classList.remove('hidden')
  } else {
    noResult.classList.add('hidden')
    displayAllpost(filtered)
  }

}



// search field
searchInput.addEventListener('input', () => {
  currentSearch = searchInput.value.trim().toLocaleLowerCase()
  applyFilter()
})


// category button
categorieBtn.forEach((catBtn) => {
  catBtn.addEventListener('click', () => {
    categorieBtn.forEach((cat) => {
      cat.classList.remove('active')
    })
    catBtn.classList.add('active')
    currentCategory = catBtn.dataset.category
    applyFilter()
  })
})


sort_btn.addEventListener('change', () => {
  sortSearch = sort_btn.value
  applyFilter()
})

const trendingDiv = document.querySelector('.js-trending-list')



function trending() {
  let trendCard = ''
  const trending = [...posts].sort((a, b) => {
    return b.likes - a.likes
  }).splice(0, 5)

  trending.forEach((Tpost, index) => {
    trendCard +=
      `
<div class="trending-item">
  <div class='trending-number'>0${index + 1}</div>
  <div>
    <a href="post.html?id=${Tpost.id} " class="trending-title">
     ${Tpost.title}
    </a>
    <div class="trending-meta">
      ${Tpost.authorName} . ${Tpost.likes === 0 ? `🤍 ${Tpost.likes}` : `❤️ ${Tpost.likes}`}
    </div>
  </div>
</div>

`
  })
  trendingDiv.innerHTML = trendCard
}

// category.addEventListener('click', (e) => {
//   const cat_btn = e.target.closest('.js-cat-btn')
//   if (!cat_btn) return
//   cat_btn.classList.add('active')
//   currentCategory= cat_btn.dataset.category
//  applyFilter()
// })





// ${user.photoURL}
// ${user.name}

//const alreadyfollowed=userToFollow.filter(user=> user.id !==ifuser.data().id)
//${user.profileImageUrl.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)}


//PRIVACY ABOUT TERM LOGIC

const aboutLink=document.querySelector('.js-about-link')
const privacyLink=document.querySelector('.js-privacy-link')
const termLink=document.querySelector('.js-terms-link')

// modals element
const aboutModal=document.querySelector('.js-about-modal')
const closeAboutModal=document.querySelector('.js-close-about')
const privacyModal=document.querySelector('.js-privacy-modal')
const closePrivacyModal=document.querySelector('.js-close-privacy')
const termModal=document.querySelector('.js-terms-modal ')
const closeTermModal=document.querySelector('.js-close-terms')

aboutLink.addEventListener('click',()=>{
  aboutModal.classList.remove('hidden')
})

closeAboutModal.addEventListener('click',()=>{
   aboutModal.classList.add('hidden')
})

privacyLink.addEventListener('click',()=>{
  privacyModal.classList.remove('hidden')
})

closePrivacyModal.addEventListener('click',()=>{
    privacyModal.classList.add('hidden')
})

termLink.addEventListener('click',()=>{
  termModal.classList.remove('hidden')
})


closeTermModal.addEventListener('click',()=>{
   termModal.classList.add('hidden')
})
