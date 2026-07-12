import { auth, db } from "./config.js"
import { watchAuthState, getPost, getfollowerAndfollowing, uploadProfileImage, getCurrentUser, updateUserDetails, uploadImageToCloudinary, follow, unfollow, updateAuthorfollowersCount, updateCurrentuserfolloweringCount } from "../onAuthStateChange_Guard.js"
import { signOut, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getDoc, doc, getDocs, onSnapshot, collection, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


const profileuid = new URLSearchParams(window.location.search).get(`uid`)
console.log(profileuid)
let currentUser;
let posts;

//LOGOUT STATE
const logoutstate = document.querySelector('.js-logged-out')
const signoutBtn = document.querySelector('.js-signout-btn')
const areUsureBox = document.querySelector('.js-ask-user')
const Notsure = document.querySelector('.js-no-not-sure')
const yesSure = document.querySelector('.js-yes-sure')
const logoutSpinner = document.querySelector('.js-logout-spinner')

//LOGIN STATE
const loginstate = document.querySelector('.js-logged-in ')
const userAvaterbtn = document.querySelector('.js-user-avatar')
const profiledropdown = document.querySelector('.js-user-dropdown')
const followBtn = document.querySelector('.js-follow-btn')
const editProfilebtn = document.querySelector('.js-edit-profile-btn')
const editProfileForm = document.querySelector('.js-edit-form')
const postCardDiv = document.querySelector('.js-profile-posts-list')
const totalPost = document.querySelector('.js-posts-tab-count')
const totalLikeCount = document.querySelector('.js-liked-tab-count')
const following = document.querySelector('.js-profile-following')
const follower = document.querySelector('.js-profile-followers')
const totalProfilePost = document.querySelector('.js-profile-posts')
const uploadImageLabel = document.querySelector('.js-edit-avatar-btn')


//EDITPROFILEBTN 
const canceleditbtn = document.querySelector('.js-cancel-edit')
const saveeditbtn = document.querySelector('.js-save-profile')


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

let likedPost;

const profileLink = document.querySelector('.js-profile-link')
const dashboardlink = document.querySelector('.js-dashboard-link')
watchAuthState(
  async (user) => {
    currentUser = user
    likedPost = await getAllLikedPost()
    profileLink.href = `profile.html?uid=${user.uid}`
    dashboardlink.href = `dashboard.html?uid=${user.uid}`
    if (user.uid === profileuid) {
      followBtn.classList.add('hidden')
      editProfilebtn.classList.remove('hidden')
      uploadImageLabel.classList.remove('hidden')
    }
    loginstate.classList.remove('hidden')
    logoutstate.classList.add('hidden')
  },
  async () => {
    //  profileLink.href=`profile.html?uid=${user.uid}`
    likedPost = await getAllLikedPost()
    loginstate.classList.add('hidden')
    logoutstate.classList.remove('hidden')
  }
)



if (profileuid) {
  getPost((post) => {
    posts = post.filter((post) => {
      return post.authorId === profileuid && post.status === `publish`
    })
    totalProfilePost.textContent = posts.length
    checkAndfollow()
    displayPost(posts)
    totalFollowerAndfollow(profileuid)
    autoLoaduserBio(profileuid)
  })
} else {
  getPost((post) => {
    posts = post.filter((post) => {
      return post.authorId === currentUser.uid && post.status === `publish`
    })
    totalProfilePost.textContent = posts.length
    checkAndfollow()
    displayPost(posts)
    totalFollowerAndfollow(currentUser.uid)
    autoLoaduserBio(currentUser.uid)
  })
}

const emptypost = document.querySelector('.js-posts-empty')
const emptyPostLiked = document.querySelector('.js-liked-empty')

function displayPost(posts) {
  if (posts.length === 0) {
    postCardDiv.innerHTML = ''
    emptypost.classList.remove('hidden')
    emptyPostLiked.classList.add('hidden')
    return
  }
  emptypost.classList.add('hidden')
  emptyPostLiked.classList.add('hidden')
  let postCard = ''
  posts.forEach((post) => {
    postCard +=
      `
    <div class="profile-post-card" data-id="${post.id}">

  <!-- POST CONTENT -->
  <div class="post-content">

    <div class="post-category">${post.category}</div>

    <a href="post.html?id=${post.id}" class="post-title">
      ${post.title}
    </a>

    <p class="post-excerpt">${post.excerpt}</p>

    <div class="post-footer">
      <span class="post-date">${post.createdAt}</span>
      <span class="post-read-time">⏱ ${post.readTime} min read</span>
      <span class="post-likes"> ${post.likes === 0 ? `🤍 ${post.likes}` : `❤️ ${post.likes}`}</span>
    </div>

  </div>

  <!-- THUMBNAIL -->
  <a href="post.html?id=${post.id}" class="post-thumb-wrap">
    <img
      class="post-thumb"
      src="${post.coverImageUrl ? post.coverImageUrl.replace('/upload/', `/upload/w_600,h_400,c_fill,g_auto/`) : ''}"
      alt=""
      loading="lazy"
    />
  </a>

</div>
    `
    // totalLike += post.likes
  })
  //totalLikeCount.textContent = totalLike
  postCardDiv.innerHTML = postCard
}

let isedit = false
editProfilebtn.addEventListener('click', () => {
  if (!isedit) {
    editProfileForm.classList.remove('hidden')
    isedit = true
  } else {
    editProfileForm.classList.add('hidden')
    isedit = false
  }

})


// EDIT PROFILE FORM

const displayName = document.querySelector('.js-edit-name')
const Bio = document.querySelector('.js-edit-bio')
const X = document.querySelector('.js-edit-twitter')
const Github = document.querySelector('.js-edit-github')
const Website = document.querySelector('.js-edit-website ')


// save user bio update
saveeditbtn.addEventListener('click', async () => {
  await getCurrentUser(profileuid, (user) => {
    const currentUser = user.user

    const userName = displayName.value === '' ? currentUser.userName : displayName.value
    const bio = Bio.value === '' ? currentUser.bio : Bio.value
    const x_handle = X.value === '' ? currentUser.x_handle : X.value
    const github = Github.value === '' ? currentUser.github : Github.value
    const website = Website.value === '' ? Website.value : currentUser.website

    const updateUserData = {
      userName,
      bio,
      x_handle,
      github,
      website
    }
    console.log(updateUserData)
    updateUserDetails(profileuid, updateUserData)
    editProfileForm.classList.add('hidden')
    isedit = false
  })
})

// PROFILE INFO 
const profileName = document.querySelector('.js-profile-name')
const username = document.querySelector('.js-profile-username')
const profileBio = document.querySelector('.js-profile-bio')
const socialLinks = document.querySelector('.js-profile-socials')
const dateJoined = document.querySelector('.js-profile-joined ')

async function autoLoaduserBio(uid) {
  await getCurrentUser(uid, (current) => {
    let currentUser = current.user
    let socials = [currentUser.x_handle, currentUser.github, currentUser.website]

    displayName.value = currentUser.userName
    Bio.value = currentUser.bio
    X.value = currentUser.x_handle
    Github.value = currentUser.github
    Website.value = currentUser.website
    profileName.textContent = `${currentUser.Fname} ${currentUser.Lname}`
    username.textContent = currentUser.userName
    profileBio.textContent = currentUser.bio

    socialLinks.innerHTML = displaySocials(socials)
  })

}

function displaySocials(socials) {
  let socialHandle = ''
  socials.forEach((social) => {
    socialHandle += social ? `<a href="${social}" class="post-title">${social}</a>` : ''
  })
  return socialHandle
}


canceleditbtn.addEventListener('click', () => {
  editProfileForm.classList.add('hidden')
  isedit = false
})



async function totalFollowerAndfollow(uid) {
  await getfollowerAndfollowing(uid, (folAndfollowing) => {
    //console.log(folAndfollowing.followers)
    follower.textContent = folAndfollowing.followers
    following.textContent = folAndfollowing.following
  })
}






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

const uploadAvaterBtn = document.querySelector('.js-avatar-input')

//upload profile picture
uploadAvaterBtn.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  const imageUrl = await uploadImageToCloudinary(file)
  await uploadProfileImage(profileuid, imageUrl)
})





const image = document.querySelector('.js-profile-avatar')
const navdropdown = document.querySelector('.js-nav-avatar')
// getCurrentUser(profileuid).then((user) => {
//   const profilePic = user.user.profileImageUrl
//   const resizeUrl = profilePic.replace('/upload/', `/upload/w_400,q_auto,f_auto/`)
//   image.src = resizeUrl
// })
let currentuserPic;
async function getCurrentUserprofilePic() {
  if (currentUser) {
    const pic = await getDoc(doc(db, 'users', currentUser.uid))
    currentuserPic = pic.data().profileImageUrl
  }

}

getCurrentUser(profileuid, async (current) => {
  await getCurrentUserprofilePic()
  const profilePic = current.user.profileImageUrl
  const resizeUrl = profilePic.replace('/upload/', `/upload/w_400,q_auto,f_auto/`)
  image.src = resizeUrl
  if (currentUser.uid !== profileuid) {
    navdropdown.src = currentuserPic
    return
  }
  navdropdown.src = resizeUrl
})



//const followBtn=document.querySelector('.js-follow-btn')

let followings;
async function checkIfFollower() {

  const follower = await getDoc(doc(db, 'users', profileuid, 'followers', currentUser.uid))
  if (follower.exists()) {
    followBtn.textContent = `Following`
    followings = true
  } else {
    followBtn.textContent = `Follow`
    followings = false
  }
}

async function checkAndfollow() {
  if (currentUser && currentUser.uid !== profileuid) {
    await checkIfFollower()
  }
}



followBtn.addEventListener('click', async () => {
  if (followings) {
    await unfollow(profileuid, currentUser.uid)
    await updateAuthorfollowersCount(profileuid, -1)
    await updateCurrentuserfolloweringCount(currentUser.uid, -1)
    checkAndfollow()
  } else {
    await follow(profileuid, currentUser.uid)
    await updateAuthorfollowersCount(profileuid, 1)
    await updateCurrentuserfolloweringCount(currentUser.uid, 1)
    checkAndfollow()
  }

})


const post_likebtn = document.querySelectorAll('.js-profile-tab')
post_likebtn.forEach((button) => {
  button.addEventListener('click', () => {
    post_likebtn.forEach((tab) => {
      tab.classList.remove('active')
    })
    button.classList.add('active')
    const type = button.dataset.tab
    if (type === `posts`) {
      displayPost(posts)
    } else {
      displayAllLikedPost(likedPost)
    }
  })
})


// get all post the current user has ever liked
async function getAllLikedPost() {
  //postCardDiv.innerHTML = ''
  try {
    const allLikedPost = await getDocs(collection(db, 'post'))
    let likedPost = []

    for (const postDoc of allLikedPost.docs) {
      const likeref = doc(db, 'post', postDoc.id, 'likes', profileuid)
      onSnapshot(likeref, (snapshot) => {
        const likesnap = snapshot.data()
        if (likesnap) {
          likedPost.push({
            id: postDoc.id,
            ...postDoc.data()
          })
        }
      })
    }

    likedPost = likedPost.filter((post) => post.authorId !== profileuid)
    return likedPost
  }
  catch (error) {
    alert(`An error occur\nRefresh the page`)
  }
}


//display all liked post by the user
function displayAllLikedPost(allLikedPost) {
  console.log(allLikedPost)
  if (allLikedPost.length === 0) {
    postCardDiv.innerHTML = ''
    emptyPostLiked.classList.remove('hidden')
    emptypost.classList.add('hidden')
    return
  }
  emptyPostLiked.classList.add('hidden')
  emptypost.classList.add('hidden')
  let likedpost = ''
  allLikedPost.forEach((post) => {
    likedpost += `
      <div class="profile-post-card" data-id="${post.id}">

  <!-- POST CONTENT -->
  <div class="post-content">

    <!-- AUTHOR ROW — show who wrote the post -->
    <div class="post-author-row">
      <img
        class="post-author-avatar"
        src="${post.authorAvater.replace('/upload/', `/upload/w_80,h_80,c_fill,g_face/`)}"
        alt=""
      />
      <a
        href="profile.html?uid=${post.authorId}"
        class="post-author-name"
      >
        ${post.authorName}
      </a>
    </div>

    <div class="post-category">${post.category}</div>

    <a href="post.html?id=${post.id}" class="post-title">
      ${post.title}
    </a>

    <p class="post-excerpt">${post.excerpt}</p>

    <div class="post-footer">
      <span class="post-date">${post.createdAt}</span>
      <span class="post-read-time">⏱ ${post.readTime} min read</span>
      <span class="post-likes">❤️ ${post.likes}</span>
    </div>

  </div>

  <!-- THUMBNAIL -->
  <a href="post.html?id=${post.id}" class="post-thumb-wrap">
    <img
      class="post-thumb"
      src="${post.coverImageUrl ? post.coverImageUrl.replace('/upload/', `/upload/w_600,h_400,c_fill,g_auto/`) : ''}"
      alt=""
      loading="lazy"
    />
  </a>

</div>

    `
  })
  postCardDiv.innerHTML = likedpost
}

const deleteAccount = document.querySelector('.js-delete-user-btn')
const confirmPasswordModal = document.querySelector('.js-password-confirm-modal')
const verifyPasswordBtn = document.querySelector('.js-verify-password')
const verifyPasswordModalError = document.querySelector('.js-password-modal-error')
const closeverifyPasswordBtn = document.querySelector('.js-close-password-modal')
const passwordInput = document.querySelector('.js-confirm-password-input')
const finalWarning = document.querySelector('.js-delete-warning-modal')
const deleteMyAccountBtn = document.querySelector('.js-confirm-delete-account')
const No_deleteUserAccount = document.querySelector('.js-cancel-delete-account')
const cancelVerifyPasswordModal = document.querySelector('.js-cancel-password-modal')

let google = false

deleteAccount.addEventListener('click', async () => {
  const providerId = currentUser.providerData[0]?.providerId
  if (providerId === `password`) {
    confirmPasswordModal.classList.remove('hidden')
  }
  else if (providerId === `google.com`) {
    google = true
    finalWarning.classList.remove('hidden')
  }
})

//START
// works if user login with password and email
verifyPasswordBtn.addEventListener('click', () => {
  const password = passwordInput.value.trim()
  reauthenticateuser(password)
  passwordInput.value = ''
})

//close confirm password close modal
closeverifyPasswordBtn.addEventListener('click', () => {
  confirmPasswordModal.classList.add('hidden')
  passwordInput.value = ''
})

//close confirm password close modal
cancelVerifyPasswordModal.addEventListener('click', () => {
  confirmPasswordModal.classList.add('hidden')
  passwordInput.value = ''
})


async function reauthenticateuser(password) {
  try {
    const credentials = EmailAuthProvider.credential(currentUser.email, password)
    const p = await reauthenticateWithCredential(currentUser, credentials)
    verifyPasswordModalError.classList.add('hidden')
    finalWarning.classList.remove('hidden')
  }
  catch (error) {
    console.log(error.message)
    if (error.code === `auth/invalid-credential`) {
      verifyPasswordModalError.classList.remove('hidden')
      verifyPasswordModalError.textContent = `Wrong password`
    }
  }
}


//trigger deleteuserdata and as well delete a user
deleteMyAccountBtn.addEventListener('click', async () => {
  if (google) {
    reauthWithgooglebeforedeleting()
    finalWarning.classList.add('hidden')
  } else {
    await deleteUser(currentUser)
    deleteUserData()
  }

})

// dont delete account
No_deleteUserAccount.addEventListener('click', () => {
  finalWarning.classList.add('hidden')
})

//END

//delete user account with all there post/data
async function deleteUserData() {
  await deleteDoc(doc(db, 'users', currentUser.uid))
  const q = query(collection(db, 'post'),
    where(`authorId`, `==`, currentUser.uid))

  const userpost = await getDocs(q)
  for (const postDoc of userpost.docs) {
    await deleteDoc(postDoc.ref)
  }
  window.location.href = `index.html`
}

// if provider is google.com

async function reauthWithgooglebeforedeleting() {
  try {
    const credentials = new GoogleAuthProvider()
    const p = await reauthenticateWithPopup(currentUser, credentials)
    await deleteUser(currentUser)
    deleteUserData()
  }
  catch (error) {
    console.log(error)
    alert(`Something went wrong\nTry Again`)
  }
}



// START
const confirm_view_unview = document.querySelector('.js-toggle-confirm-password')
const passwordfield = document.querySelector('.js-confirm-password-input')
const showIcon = document.querySelector('.js-show-icon')
const hideIcon = document.querySelector('.js-hide-icon')


confirm_view_unview.addEventListener('click', () => {
  viewAndUnviewpassword(passwordfield, showIcon, hideIcon)
})

function viewAndUnviewpassword(password, show, hide) {
  password.type = password.type === `password` ? `text` : `password`
  if (password.type === `text`) {
    show.classList.add('hidden')
    hide.classList.remove('hidden')
  } else {
    show.classList.remove('hidden')
    hide.classList.add('hidden')
  }
}
//END

