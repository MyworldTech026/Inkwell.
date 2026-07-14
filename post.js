import { auth, db } from './config.js'
import { getDoc,getDocs, doc, collection, addDoc, deleteDoc, onSnapshot, setDoc, updateDoc, increment,query,where ,limit} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { watchAuthState, getComments, updateCommentCount, updateLikeCount,updateLikecommentCount, follow, unfollow, updateAuthorfollowersCount, updateCurrentuserfolloweringCount } from "../onAuthStateChange_Guard.js"
const postid = new URLSearchParams(window.location.search).get('id')

let posts;
let currentuser;

const navAuth = document.querySelector('.js-logged-out')
const loginToComment = document.querySelector('.js-login-to-comment')

//login state
const navUser = document.querySelector('.js-logged-in ')
const postCategory = document.querySelector('.js-post-category')
const postTitle = document.querySelector('.js-post-title')
const postExcerpt = document.querySelector('.js-post-excerpt')
const authorName = document.querySelector('.js-author-name')
const postDate = document.querySelector('.js-post-date')
const readTime = document.querySelector('.js-read-time ')
const postViews = document.querySelector('.js-post-views')
const postTag = document.querySelector('.js-post-tags')
const postBody = document.querySelector('.js-post-body')
const editpost = document.querySelector('.js-edit-post-btn')
const deletepost = document.querySelector('.js-delete-post-btn')
const deletemodal = document.querySelector('.js-delete-modal')
const cancelDeletebtn = document.querySelector('.js-cancel-delete')
const yesDeleteBtn = document.querySelector('.js-confirm-delete')
const dropComment = document.querySelector('.js-comment-input')
const postComment = document.querySelector('.js-submit-comment')
const commentCount = document.querySelector('.js-comment-count')
const commentBadge = document.querySelector('.js-comments-count')
const shareBtn = document.querySelector('.js-share-btn')
const shareDropDown = document.querySelector('.js-share-dropdown')
const likeCount = document.querySelector('.js-like-count')
const link = document.querySelector('.login-comment-link')
//follow button
const followBtn = document.querySelector('.js-follow-btn')


let copyLinkBtn = document.querySelector('.js-copy-link')
const shareToX=document.querySelector('.js-share-to-x')
const shareToWhatsapp=document.querySelector('.js-share-to-whatsapp')
let toast = document.querySelector('.js-toast')

let share = false
// share button
shareBtn.addEventListener('click', () => {
  if (!share) {
    shareDropDown.classList.remove('hidden')
    share = true
  } else {
    shareDropDown.classList.add('hidden')
    share = false
  }
})

//copy link button
copyLinkBtn.addEventListener('click', () => {
  let url = window.location.href
  navigator.clipboard.writeText(url)
  shareDropDown.classList.add('hidden')
  toast.classList.remove('hidden')
  toast.textContent = `copied`
  share = false
  setTimeout(() => {
    toast.classList.add('hidden')
  }, 3000)
})

shareToX.addEventListener('click',()=>{
  const postTitle=singlePost.title
  const postUrl=window.location.href
  const twitterUrl=`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}$url=${encodeURIComponent(postUrl)}`
  shareToX.href=twitterUrl
})

shareToWhatsapp.addEventListener('click',()=>{
   const postTitle=singlePost.title
  const postUrl=window.location.href
  const whatsappUrl=`https://wa.me/?text=${encodeURIComponent(postTitle + ' ' +postUrl)}`
  shareToWhatsapp.href=whatsappUrl
})

// sidebar copy link logic
const sideBarCopyLink=document.querySelector('.js-sidebar-share')

 sideBarCopyLink.addEventListener('click',()=>{
  let url = window.location.href
  navigator.clipboard.writeText(url)
  shareDropDown.classList.add('hidden')
  toast.classList.remove('hidden')
  toast.textContent = `copied`
  share = false
  setTimeout(() => {
    toast.classList.add('hidden')
  }, 3000)
 })


loginToComment.addEventListener('click', () => {
  window.location.href = `auth.html?id=${postid}`
})



let postuserid;
// check if a user is login or logout
watchAuthState(
  async (user) => {
    currentuser = user
    await checkIfLiked()
    navUser.classList.add('hidden')
    navAuth.classList.add('hidden')
    await getSinglePost( async(post) => {
      // postuserid=post.authorId
      posts = post
      if (user.uid === post.authorId) {
        editpost.classList.remove('hidden')
        deletepost.classList.remove('hidden')
        followBtn.classList.add('hidden')
      }
       await getBio()
       await moreFromThisAuthor()
       getCurrentUser()
      displaypost(post)
    })
  },
  async () => {
    await getSinglePost(async(post) => {
      //postuserid=post.authoruid
      posts = post
      await getBio()
      await moreFromThisAuthor()
      displaypost(post)
    })
    editpost.classList.add('hidden')
    deletepost.classList.add('hidden')
    loginToComment.classList.remove('hidden')
    link.href = `auth.html?id=${postid}`
    navUser.classList.add('hidden')
    navAuth.classList.remove('hidden')
  }
)

let singlePost;
//get a single post and display it in real time even when login or logout
function getSinglePost(callback) {
  onSnapshot(doc(db, 'post', postid), (snapshot) => {
    singlePost = snapshot.data()
     postuserid= singlePost.authorId
    callback(snapshot.data())
    checkAndfollow()
    checkifViewed()
  })
}

const coverImageDiv = document.querySelector('.js-cover-image-wrap')
const coverImage = document.querySelector('.js-cover-image')
const sidebarlikecount=document.querySelector('.js-sidebar-like-count')
const coverimglink=document.querySelector('.js-post-author-link')
const authorAvatar=document.querySelector('.js-author-avatar')
//display getSinglePost
function displaypost(post) {
  post.coverImageUrl ? coverImageDiv.classList.remove('hidden') : coverImageDiv.classList.add('hidden')
  authorAvatar.src=post.authorAvater.replace('/upload/', `/upload/w_1200,c_scale/`)
   coverImage.src=  post.coverImageUrl?post.coverImageUrl.replace('/upload/', `/upload/w_1200,c_scale/`):''
  postCategory.textContent = post.category
  postTitle.textContent = post.title
  postExcerpt.textContent = post.excerpt
  authorName.textContent = post.authorName
  authorName.href=`profile.html?uid=${postuserid}`
  coverimglink.href=`profile.html?uid=${postuserid}`
  postDate.textContent = post.createdAt
  readTime.textContent = `${post.readTime} min`
  postViews.textContent = `${post.views} views`
  postTag.textContent = post.tags
  postBody.innerHTML = post.content
  commentCount.textContent = post.comments
  commentBadge.textContent = post.comments
  likeCount.textContent = post.likes
  sidebarlikecount.textContent=post.likes
}


// get the bio of the user that make a post that other user view, then display it on the bio section of the post page
async function getBio(){
  console.log(postuserid)
  let bio=await getDoc(doc(db,'users',postuserid))
  display(bio.data())
}

const bioAvater=document.querySelector('.js-bio-avatar')
 const bioName=document.querySelector('.js-bio-name')
 const bioText=document.querySelector('.js-bio-text')
 const bioFollower=document.querySelector('.js-bio-followers')

function display(bio){
  bioAvater.src=bio.profileImageUrl.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)
  bioName.textContent=`${bio.Fname} ${bio.Lname}`
  bioName.href=`profile.html?uid=${postuserid}`
  bioText.textContent=bio.bio
  bioFollower.textContent=`${bio.followers} followers`
}

// more from this author logic
const moreCard=document.querySelector('.js-more-posts')
async function moreFromThisAuthor() {
  const querys= query(collection(db,'post'),
      where (`authorId`, `==`, postuserid),
      where(`status`, `==`,`publish`),
      limit(4)
    )
  const more=await getDocs(querys)
   const morePost=more.docs.map((doc)=>{
    return {
      id:doc.id,
      ...doc.data()
    }
   }).filter(p=>p.id !== postid)
  displayMoreFromAuthor(morePost)
}

function displayMoreFromAuthor(moreFromAuthor){
  if(moreFromAuthor.length===0){
    moreCard.textContent=`Noting to show yet`
    return
  }
 let eachMoreCard=''
  moreFromAuthor.forEach((post)=>{
     eachMoreCard+=`
     <a href="post.html?id=${post.id}" class="more-post-item">

  <div class="more-post-title">${post.title}</div>

  <div class="more-post-meta">
    ${post.readTime} min read ·  ${post.likes === 0 ? `🤍 ${post.likes}` : `❤️ ${post.likes}`}
  </div>

</a>
     `
  })
   moreCard.innerHTML=eachMoreCard  
}

async function checkifViewed() {
  if (!currentuser) return
  const viewed = await getDoc(doc(db, 'post', postid, 'views', currentuser.uid))
  if (viewed.exists()) {
    return
  } else {
    await setDoc(doc(db, 'post', postid, 'views', currentuser.uid), { viewedAt: new Date().toISOString() })
    await updateDoc(doc(db, 'post', postid), { views: increment(1) })
  }
}





editpost.addEventListener('click', () => {
  editpost.href = `write.html?id=${postid}`
})

deletepost.addEventListener('click', () => {
  deletemodal.classList.remove('hidden')
})

cancelDeletebtn.addEventListener('click', () => {
  deletemodal.classList.add('hidden')
})

yesDeleteBtn.addEventListener('click', () => {
  deletePost()
})

// delete post
async function deletePost() {
  await deleteDoc(doc(db, 'post', postid))
  window.location.href = `index.html`
}


postComment.addEventListener('click', () => {
  if(!currentuser){
     alert(`sign in to perform any activity`)
    return
  }
  const comment = dropComment.value
  if (!comment) return
  getCurrentUser().then((user) => {
    let Comment = {
      text: comment,
      authorId: currentuser.uid,
      authorName: `${user.Fname} ${user.Lname}`,
      authorAvater: user.profileImageUrl ,
      createdAt: new Date().toISOString(),
      like: 0
    }
   createComment(Comment)
    dropComment.value = ''
  })

})

async function createComment(comment) {
  await addDoc(collection(db, 'post', postid, 'comments'), comment)
  updateCommentCount(postid, 1)
}


const commentAvater=document.querySelector('.js-comment-user-avatar')
// get currently login user details in order for me to get the user name
// pass the user name into the comment the user make
async function getCurrentUser() {
  const uid = currentuser.uid
  const user = await getDoc(doc(db, 'users', uid))
   commentAvater.src=user.data().profileImageUrl.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)
  return user.data()
}




const commentContainer = document.querySelector('.js-comments-list')
let allComments = []

getComments((comment) => {
  allComments = comment
  displayComment(comment)
}, postid)


function displayComment(comments) {
  console.log(comments)
  let CommentCard = ''
  comments.forEach((comment) => {
    CommentCard +=
      `
<div class="js-comment-card comment-card" data-id="${comment.id}">

  <img 
    class="comment-avatar" 
    src="${comment.authorAvater.replace('/upload/',`/upload/w_80,h_80,c_fill,g_face/`)}" 
    alt="${comment.authorName}" 
  />

  <div class="comment-body">
    <div class="comment-header">
      <span class="comment-author">${comment.authorName}</span>
      <span class="comment-date">${comment.createdAt}</span>
    </div>

    <p class="comment-text">${comment.text}</p>

    <div class="comment-actions">
      <button class="js-comment-like-btn comment-like-btn">${comment.like === 0 ? `🤍 ${comment.like}` : `❤️ ${comment.like}`}</button>
      <button class="comment-reply-btn hidden">Reply</button>
      <!-- Only show delete if current user wrote this comment -->

      ${showdeletecommentbutton(comment)}
    </div>
  </div>

</div>

`

  })
  commentContainer.innerHTML = CommentCard
}

// like comment logic
// if(currentuser.uid){
  
// }
//const likeCommentbtn=document.querySelector('.js-comment-like-btn')

commentContainer.addEventListener('click',async(e)=>{
  if(!currentuser){
     alert(`sign in to perform any activity`)
    return
  }
const likeCommentbtn=e.target.closest('.js-comment-like-btn')
if(!likeCommentbtn)return
const eachCard=likeCommentbtn.closest('.js-comment-card')
const commentid=eachCard.dataset.id 
await checkIfLikedComment(commentid)
likeComment(commentid)
})

let  isLikedcomment;
async function checkIfLikedComment(commentid) {
  const likecomment = await getDoc(doc(db, 'post', postid, 'comments',commentid,'likes', currentuser.uid))
  if (likecomment.exists()) {
    isLikedcomment = true
  }
  else {
    isLikedcomment = false
  }
}


async function likeComment(commentid){
    const likecommenticon=document.querySelector('.js-comment-like-btn')
   if ( isLikedcomment) {
    await deleteDoc(doc(db, 'post', postid, 'comments',commentid,'likes', currentuser.uid))
    updateLikecommentCount(postid,commentid, -1)
    isLiked = false
  }
  else {
    await setDoc(doc(db, 'post', postid, 'comments',commentid,'likes', currentuser.uid), {
      likedAt: new Date().toISOString()
    })
    await updateLikecommentCount(postid,commentid, 1)
    isLiked = true
  }
}


function showdeletecommentbutton(comment) {
  if (currentuser && currentuser.uid === comment.authorId) {
    return `
        <button class="comment-delete-btn js-delete-comment"
        data-id="${comment.id}">
        Delete
      </button>
      `
  } else {
    return `
        <button class="comment-delete-btn js-delete-comment hidden"
        data-id="${comment.id}">
        Delete
      </button>
      `
  }
}

// like comment logic
commentContainer.addEventListener('click', (e) => { 
  const deletecommentbtn = e.target.closest('.js-delete-comment')
  if (!deletecommentbtn) return
  const deleteCommentId = deletecommentbtn.dataset.id
  deleteComment(deleteCommentId)
})


async function deleteComment(deleteid) {
  await deleteDoc(doc(db, 'post', postid, 'comments', deleteid))
  updateCommentCount(postid, -1)
}



//LIKE AND UNLIKE LOGIC

const likeBtn = document.querySelector('.js-like-btn')
const likeIcon = document.querySelector('.js-like-icon')
const sideBarLikeBtn=document.querySelector('.js-sidebar-like')
const sidebarlikeicon=document.querySelector('.js-sidebar-like-icon')
let isLiked;

async function checkIfLiked() {
  const like = await getDoc(doc(db, 'post', postid, 'likes', currentuser.uid))
  if (like.exists()) {
    likeBtn.classList.add('liked')
    likeIcon.textContent = '❤️'
    sidebarlikeicon.textContent = '❤️'
    isLiked = true
  }
  else {
    likeBtn.classList.remove('liked')
    likeIcon.textContent = '🤍'
    sidebarlikeicon.textContent = '🤍'
    isLiked = false
  }
 // console.log(isLiked)
}



likeBtn.addEventListener('click', async () => {
  if(!currentuser){
    alert(`sign in to perform any activity`)
    return
  }
  if (isLiked) {
    await deleteDoc(doc(db, 'post', postid, 'likes', currentuser.uid))
    updateLikeCount(postid, -1)
    likeBtn.classList.remove('liked')
    sidebarlikeicon.textContent = '🤍'
    likeIcon.textContent = '🤍'
    isLiked = false
  }
  else {
    await setDoc(doc(db, 'post', postid,'likes', currentuser.uid), {
      likedAt: new Date().toISOString()
    })
    await updateLikeCount(postid, 1)
    likeBtn.classList.add('liked')
   sidebarlikeicon.textContent = '❤️'
     likeIcon.textContent = '❤️'
    isLiked = true
  }
})

// sidebar click
sideBarLikeBtn.addEventListener('click',async()=>{
   if (isLiked) {
    await deleteDoc(doc(db, 'post', postid, 'likes', currentuser.uid))
    updateLikeCount(postid, -1)
    likeBtn.classList.remove('liked')
    sidebarlikeicon.textContent = '🤍'
      likeIcon.textContent = '🤍'
    isLiked = false
  }
  else {
    await setDoc(doc(db, 'post', postid, 'likes', currentuser.uid), {
      likedAt: new Date().toISOString()
    })
    await updateLikeCount(postid, 1)
    likeBtn.classList.add('liked')
    sidebarlikeicon.textContent = '❤️'
     likeIcon.textContent = '❤️'
    isLiked = true
  }
})





let following;
async function checkIfFollower() {
  const follower = await getDoc(doc(db, 'users', singlePost.authorId, 'followers', currentuser.uid))

  if (follower.exists()) {
    followBtn.textContent = `Following`
    following = true
  } else {
    followBtn.textContent = `Follow`
    following = false
  }
}

async function checkAndfollow() {
  if (currentuser && currentuser.uid !== singlePost.authorId) {
    await checkIfFollower()
  }
}



followBtn.addEventListener('click', async () => {
  if (following) {
    await unfollow(singlePost.authorId, currentuser.uid)
    await updateAuthorfollowersCount(singlePost.authorId, -1)
    await updateCurrentuserfolloweringCount(currentuser.uid, -1)
    checkAndfollow()
  } else {
    await follow(singlePost.authorId, currentuser.uid)
    await updateAuthorfollowersCount(singlePost.authorId, 1)
    await updateCurrentuserfolloweringCount(currentuser.uid, 1)
    checkAndfollow()
  }

})
