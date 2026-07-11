import { db } from './config.js'
import { getDoc, doc, collection, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { watchAuthState ,uploadImageToCloudinary} from './onAuthStateChange_Guard.js'

const postid = new URLSearchParams(window.location.search).get('id')
const dashboarduid= new URLSearchParams(window.location.search).get('uid')
console.log(postid)

async function getSinglePost() {
  const post = await getDoc(doc(db, 'post', postid))
  return post.data()
}


const wordCount = document.querySelector('.js-word-count')
const readtime = document.querySelector('.js-read-time-estimate')

const publishBtn = document.querySelector('.js-publish-btn')
const titles = document.querySelector('.js-post-title')
const excerpts = document.querySelector('.js-post-excerpt')
const editors = document.querySelector('.js-editor')
const toobarsdiv = document.querySelector('.js-toolbar')

//PUBLISH MODAL 
const publishModal = document.querySelector('.js-publish-modal')
const closeModal = document.querySelector('.js-close-publish')
const previewTitle = document.querySelector('.js-publish-title-preview')
const previewExcerpt = document.querySelector('.js-publish-excerpt-preview')
const postCategoryBtn = document.querySelector('.js-post-category')
const tag = document.querySelector('.js-post-tags-input')
const publishErrorAlert = document.querySelector('.js-publish-error')

//PUBLISH BUTTON
const publishNowBtn = document.querySelector('.js-confirm-publish')
const publishbtntext = document.querySelector('.js-confirm-publish-text')
const publishingSpinner = document.querySelector('.js-confirm-publish-loading')
//SAVE AS DRAFT 
const saveAsDraftBtn = document.querySelector('.js-save-draft')

let userId;
let users;

let category;
postCategoryBtn.addEventListener('change', () => {
  category = postCategoryBtn.value
})





const labelBtn=document.querySelector('.js-cover-upload')
const uploadImage=document.querySelector('.js-cover-input')
const fullPreview=document.querySelector('.js-cover-preview')
const previewCover=document.querySelector('.js-publish-cover')
const preview=document.querySelector('.js-publish-cover-img')
const coverPreview=document.querySelector('.js-cover-img')
const removecoverPreviewBtn=document.querySelector('.js-remove-cover')

let coverImageUrl='';
let previewImage='';
let global=''

labelBtn.addEventListener('change',async()=>{
 let file=uploadImage.files[0]
 previewImage= URL.createObjectURL(file)
 fullPreview.classList.remove('hidden')
 labelBtn.classList.add('hidden')
 coverPreview.src=previewImage
const imageUrl = await uploadImageToCloudinary(file)
console.log(imageUrl)
coverImageUrl=imageUrl

})

// remove cover image delete button
removecoverPreviewBtn.addEventListener('click',()=>{
   global=''
  previewImage=''
  coverImageUrl=''
   coverPreview.src=''
    fullPreview.classList.add('hidden')
    labelBtn.classList.remove('hidden')
     preview.src=''
     previewCover.classList.add('hidden')
})

// publish a post to db
publishNowBtn.addEventListener('click', async () => {
  if(!userId){
    publishErrorAlert.classList.remove('hidden')
    publishErrorAlert.textContent=`you need to login to publish post`
    setTimeout(()=>{
        publishErrorAlert.classList.add('hidden')
    },3000)
    return
  }
  const post = await collectUserData(`publish`)
!postid ? createPost(post) : updateEditpost(post)
})


async function collectUserData(status) {
  const authorAvater=users.profileImageUrl
  const authorId = userId
  const authorName = `${users.Fname} ${users.Lname}`
  const title = titles.value
  const excerpt = excerpts.value
  const editor = editors.innerHTML
  const tags = tag.value.trim().split(',')

  const readTime = calculateReadTime(editor)

  let currentPost = postid ? await getSinglePost() : ''

  const post = {
    title,
    excerpt,
    content: editor,
    category: category || postCategoryBtn.value,
    tags,
    status,
    authorId,
    authorName,
    authorAvater,
    likes: currentPost ? currentPost.likes : 0,
    views: currentPost ? currentPost.views : 0,
    comments: currentPost ? currentPost.comments : 0,
    readTime: currentPost ? currentPost.readTime : readTime.readTime,
    words:currentPost ? currentPost.words: readTime.words,
    coverImageUrl:global? global:coverImageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
return post
}

function calculateReadTime(editor) {
 const words= editor.trim().length
 const readTime = Math.ceil(words / 200)
 return {readTime,words}
}


editors.addEventListener('input', () => {
  const words = editors.textContent.trim().length
  const readTime = Math.ceil(words / 200)
  wordCount.textContent = `${words} words`
  readtime.textContent = `~${readTime}  min read`  
})


saveAsDraftBtn.addEventListener('click', async () => {
  const post = await collectUserData(`draft`)
  !postid ? createPost(post) : updateEditpost(post)
})


const draftStatus = document.querySelector('.js-save-status')


// create a post
async function createPost(post) {
  try {
    if (post.status === `draft`) {
      const newPost = await addDoc(collection(db, 'post'), post)
      draftStatus.textContent = `draft saved`
      publishModal.classList.add('hidden')
      return
    }
    saveAsDraftBtn.disabled = true
    draftStatus.textContent = ``
    publishbtntext.textContent = ''
    publishingSpinner.classList.remove('hidden')
    const newPost = await addDoc(collection(db, 'post'), post)
    saveAsDraftBtn.disabled = false
    window.location.href = `post.html?id=${newPost.id}`

  }
  catch (error) {
    console.log(error)
    publishbtntext.textContent = '🚀 Publish Now'
    publishingSpinner.classList.add('hidden')
    publishErrorAlert.classList.remove('hidden')
    publishErrorAlert.textContent = `No internet connection`
    setTimeout(() => {
      publishErrorAlert.classList.add('hidden')
    }, 3000)

  }
}


closeModal.addEventListener('click', () => {
  publishModal.classList.add('hidden')
  publishbtntext.textContent = '🚀 Publish Now'
  publishingSpinner.classList.add('hidden')
})



publishBtn.addEventListener('click', () => {
  !previewImage? previewCover.classList.add('hidden'): previewCover.classList.remove('hidden')
  publishModal.classList.remove('hidden')
  previewTitle.textContent = titles.value
  previewExcerpt.textContent = excerpts.value
   preview.src=previewImage
})

toobarsdiv.addEventListener('click', (e) => {
  const tool = e.target.closest('.tool-btn')
  if (!tool) return
  const command = tool.dataset.command

  const com = command === `h1` || command === `h2` || command === `h3` || command === `blockquote`
    ? formatHeadings(command)
    : document.execCommand(command)
  editors.focus()
})

function formatHeadings(command) {
  document.execCommand('formatBlock', false, command)
}




watchAuthState(
  async (user) => {
    userId = user.uid
    users = await getUser()
  },

  () => {
    console.log(`hello`)
  }
)

async function getUser() {
  const user = await getDoc(doc(db, 'users', userId))
  return user.data()
}


// get post to edit
async function getEditPost() {
  const editpost = await getDoc(doc(db, 'post', postid))
  return editpost.data()
}

// check if there is post to edit by getting the id of the post
if (postid) {
  const editpost = await getEditPost()
  displayEditPost(editpost)
}

//render the post for edit
function displayEditPost(editpost) {
  console.log(editpost)
  global=editpost.coverImageUrl
  previewImage=editpost.coverImageUrl
  fullPreview.classList.remove('hidden')
  previewCover.classList.remove('hidden')
  preview.src=editpost.coverImageUrl
  coverPreview.src=editpost.coverImageUrl===''?fullPreview.classList.add('hidden'):editpost.coverImageUrl
  titles.textContent = editpost.title
  excerpts.textContent = editpost.excerpt
  editors.innerHTML = editpost.content
  postCategoryBtn.value = editpost.category
  tag.value = editpost.tags.join(',')
  readtime.textContent=`~${editpost.readTime} min read`
  wordCount.textContent=`${editpost.words} words`
}

// save edited post to db
async function updateEditpost(post) {
  console.log(post)
  try {
    if (post.status === `draft`) {
      const newPost = await updateDoc(doc(db, 'post', postid), post)
      draftStatus.textContent = `draft saved`
      publishModal.classList.add('hidden')
      return
    }
    saveAsDraftBtn.disabled = true
    draftStatus.textContent = ``
    publishbtntext.textContent = ''
    publishingSpinner.classList.remove('hidden')
     await updateDoc(doc(db, 'post', postid), post)
    saveAsDraftBtn.disabled = false
    window.location.href = `post.html?id=${postid}`
  }
  catch (error) {
    console.log(error)
    publishbtntext.textContent = '🚀 Publish Now'
    publishingSpinner.classList.add('hidden')
    publishErrorAlert.classList.remove('hidden')
    publishErrorAlert.textContent = `No internet connection`
    setTimeout(() => {
      publishErrorAlert.classList.add('hidden')
    }, 3000)
  }
}


