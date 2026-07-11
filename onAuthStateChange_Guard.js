import {auth,db} from './config.js'
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getDocs, getDoc, doc, collection, addDoc,onSnapshot,increment, updateDoc,setDoc,deleteDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


export function watchAuthState(onLogin,onLogOut){
 onAuthStateChanged(auth,(user)=>{
  if(user){
    onLogin(user)
  }else{
    onLogOut()
  }
 })
}

export async function getPost(callback){
onSnapshot(collection(db,'post'),(snap)=>{
  const posts=snap.docs.map(doc=>({
    id:doc.id,
    ...doc.data()
  }))
  callback(posts)
})
}

export async function getComments(callback,postid){
  onSnapshot(collection(db,'post',postid,'comments'),(snapshot)=>{
  let comment=  snapshot.docs.map(doc=>({
      id:doc.id,
      ...doc.data()
    }))
    callback(comment)
  })
}

export async function updateCommentCount(postid,number){
 await updateDoc(doc(db,'post',postid),
 {
  comments:increment(number)
 }
)
}

export async function updateLikeCount(postid,number){
  await updateDoc(doc(db,'post',postid),
 {
  likes:increment(number)
 }
)
}

export async function updateLikecommentCount(postid,commentid,number){
   await updateDoc(doc(db,'post',postid,'comments',commentid),
 {
  like:increment(number)
 }
)
}



export async function follow(authorid,userid){
  await setDoc(doc(db,'users',authorid,'followers',userid),{followAt:new Date().toISOString()})
}

export async function unfollow(authorid,userid){
  await deleteDoc(doc(db,'users',authorid,'followers',userid))
}

export async function  updateAuthorfollowersCount(authorid,number){
 await updateDoc(doc(db,'users',authorid),
 {
  followers:increment(number)
 }
)
}

export async function updateCurrentuserfolloweringCount(currentuserid,number){
 await updateDoc(doc(db,'users',currentuserid),
 {
 following:increment(number)
 }
)
}

export async function getfollowerAndfollowing(userId,callback){
 onSnapshot(doc(db,'users',userId),(user)=>{
   callback(user.data())
 })
}

export async function uploadProfileImage(profileuid,imageUrl){
  try{
      await updateDoc(doc(db,'users',profileuid),{profileImageUrl:imageUrl})
  }
  catch(error){
    alert(`Fail to upload`)
  }
 
}


// export async function getCurrentUser(profileuid) {
//   const user = await getDoc(doc(db, 'users', profileuid))
//   return {id:user.id,user:user.data()}
// }

export async function getCurrentUser(profileuid,callback){
  onSnapshot(doc(db,'users',profileuid),(snapshot)=>{
    const snap={
      id:snapshot.id,
      user:snapshot.data()
    }
    callback(snap)
  })
}


export async function updateUserDetails(profileuid,updateData){
   try{
      await updateDoc(doc(db,'users',profileuid),updateData)
  }
  catch(error){
    alert(`Fail to update`)
  }
 
}


const cloud_name = `inkswellblog`
const upload_preset = `Inkswell_social`

export async function uploadImageToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', upload_preset)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()
  return data.secure_url
}