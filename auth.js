import { auth, db } from './config.js'
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
const signupForm = document.querySelector('.js-signup-form')
const signinForm = document.querySelector('.js-signin-form')

const signup = document.querySelector('.js-signup-tab')
const signin = document.querySelector('.js-signin-tab')

const bottomText = document.querySelector('.js-auth-bottom-text')
const bottomBtn = document.querySelector('.js-auth-switch')

// SIGN UP FORM details
//══════════════════ 
const firstname = document.querySelector('.js-signup-firstname')
const lastname = document.querySelector('.js-signup-lastname')
const username = document.querySelector('.js-signup-username')
const email = document.querySelector('.js-signup-email')
const password = document.querySelector('.js-signup-password')
const confirmpassword = document.querySelector('.js-signup-confirm')
const T_C_checkbox = document.querySelector('.js-terms-checkbox')
const createAcctbtn = document.querySelector('.js-signup-btn')
const signup_spinner = document.querySelector('.js-signup-loading')
const createAcctText = document.querySelector('.js-signup-btn-text')
const signupErrorAlert = document.querySelector('.js-signup-error')

// SIGN IN FORM details
//══════════════════ 
const signinEmail = document.querySelector('.js-signin-email')
const signinPassword = document.querySelector('.js-signin-password')
const forgottenPassword = document.querySelector('.js-forgot-password')
const signinBtn = document.querySelector('.js-signin-btn')
const signin_text = document.querySelector('.js-signin-btn-text')
const signin_spinner = document.querySelector('.js-signin-loading')
const signinErrorAlert = document.querySelector('.js-signin-error')


const postid = new URLSearchParams(window.location.search).get('id')


//signin button
signinBtn.addEventListener('click', () => {
  const Email = signinEmail.value
  const Password = signinPassword.value
  signinUser(Email, Password)
})

async function getSinglePost() {
  const post = await getDoc(doc(db, 'post', postid))
  return post.data()
}


//signin with google

const GoogleSignUpbtn = document.querySelector('.js-google-signup')
const GoogleSigninBtn = document.querySelector('.js-google-signin')

//GoogleSignUpbtn
GoogleSignUpbtn.addEventListener('click', () => {
  googlesignin_signup()
})


const provider = new GoogleAuthProvider()

//GoogleSigninbtn
GoogleSigninBtn.addEventListener('click', async () => {
  googlesignin_signup()
})

//  googlesignin_signup function
async function googlesignin_signup() {
  try {
    //signinPopup
    const signupGoogle = await signInWithPopup(auth, provider)
    const user = signupGoogle.user
    let name = user.displayName.trim().split(/\s+/)
    let Firstname = name[0]
    let Lastname = name.length > 1 ? name.slice(1).join(' ') : ''
    console.log(user.email.split('@')[0])
    const userSnap = await getDoc(doc(db, 'users', user.uid))
    if (!userSnap.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        Fname: Firstname,
        Lname: Lastname,
        Email: user.email,
        profileImageUrl: user.photoURL,
        userName: Firstname,
        bio: '',
        followers: 0,
        following: 0,
        github: '',
        website: '',
        x_handle: ''
      })
    }

    window.location.href = `index.html`
  } catch (error) {
    console.log(`Error:`, error.message)
  }
}



//signin user function
async function signinUser(email, password) {
  try {
    signin_text.textContent = ''
    signin_spinner.classList.remove('hidden')
    await signInWithEmailAndPassword(auth, email, password)
    !postid ? window.location.href = `index.html` : window.location.href = `post.html?id=${postid}`
  }
  catch (error) {
    if (error.code === `auth/invalid-email`) {
      signinErrorAlert.classList.remove('hidden')
      signinErrorAlert.textContent = `wrong email`
      signin_text.textContent = 'Sign In'
      signin_spinner.classList.add('hidden')
      setTimeout(() => {
        signinErrorAlert.classList.add('hidden')
      }, 4000)
    }
    else if (error.code === `auth/invalid-credential`) {
      signinErrorAlert.classList.remove('hidden')
      signinErrorAlert.textContent = `user not found`
      signin_text.textContent = 'Sign In'
      signin_spinner.classList.add('hidden')
      setTimeout(() => {
        signinErrorAlert.classList.add('hidden')
      }, 4000)
    }
    else if (error.code === `auth/missing-password`) {
      signinErrorAlert.classList.remove('hidden')
      signinErrorAlert.textContent = `password field cant be empty`
      signin_text.textContent = 'Sign In'
      signin_spinner.classList.add('hidden')
      setTimeout(() => {
        signinErrorAlert.classList.add('hidden')
      }, 4000)
    }
  }
}

// function handleErrorDisplay(errorcode){
// switch(errorcode){
//   case 
// }
// }


const forgottenPasswordModal = document.querySelector('.js-forgot-modal')
const closeForgetpassModal = document.querySelector('.js-close-forgot')
const sendLink = document.querySelector('.js-send-reset')
const email_forgoten_password_reset = document.querySelector('.js-forgot-email')
const successMessage = document.querySelector('.js-forgot-success')
const errorMessage = document.querySelector('.js-forgot-error')
//forgotton password button
forgottenPassword.addEventListener('click', () => {
  forgottenPasswordModal.classList.remove('hidden')
})

closeForgetpassModal.addEventListener('click', () => {
  forgottenPasswordModal.classList.add('hidden')
})

// send password reset link trigger
sendLink.addEventListener('click', async () => {
  const email = email_forgoten_password_reset.value.trim()
  if(!email){
     successMessage.classList.add('hidden')
    errorMessage.classList.remove('hidden')
     errorMessage.textContent =`Please enter your email`
  }
  try {
    await sendPasswordResetEmail(auth, email)
    errorMessage.classList.add('hidden')
    successMessage.classList.remove('hidden')
     email_forgoten_password_reset.value=''
  }
  catch (error) {
    if (error.code === `auth/invalid-email`) {
      errorMessage.textContent = `Email format is wrong`
    } 
    else if (error.code === `auth/too-many-requests`) {
      errorMessage.textContent = `Too many attempt`
    }
    successMessage.classList.add('hidden')
    errorMessage.classList.remove('hidden')
  }

})


 email_forgoten_password_reset.addEventListener('input',()=>{
   successMessage.classList.add('hidden')
    errorMessage.classList.add('hidden')
 })

// create an account trigger
createAcctbtn.addEventListener('click', () => {
  collectUserDetails()
})


async function collectUserDetails() {
  const Fname = firstname.value
  const Lname = lastname.value
  const userName = username.value
  const Email = email.value
  const Password = password.value
  const confirmpass = confirmpassword.value
  const checkbox = T_C_checkbox

  // if(!Email.includes(`@`)){
  //   signupErrorAlert.classList.remove('hidden')
  //   signupErrorAlert.textContent=`incorrect email`
  //   return
  // }

  if (Password === `` || confirmpass === ``) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = `Password field can't be empty`
    return
  }

  if (Password !== confirmpass) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = `Password do not match`
    return
  }

  if (!checkbox.checked) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = `check the box`
    return
  }
  signupErrorAlert.classList.add('hidden')
  const userDetails = {
    Fname,
    Lname,
    userName,
    Email,
    followers: 0,
    following: 0,
    profileImageUrl: '',
    bio: ''
  }

  await createAccount(Email, Password, userDetails)
}

const passwordStrength = document.querySelector('.js-password-strength')
const strengthfill = document.querySelector('.js-strength-fill')
const strengthText = document.querySelector('.js-strength-text')

// added event listener to password field
password.addEventListener('input', () => {
  checkPasswordStrength(password.value.trim())
})


// check password strength
function checkPasswordStrength(password) {
  let score = 0

  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) {
    console.log(score)
    passwordStrength.classList.remove('hidden')
    strengthfill.classList.remove('medium')
    strengthfill.classList.remove('strong')
    strengthfill.classList.add('weak')

    strengthText.classList.remove('medium')
    strengthText.classList.remove('strong')
    strengthText.classList.add('weak')
    strengthText.textContent = `poor`
  } else if (score === 3 || score == 4) {
    console.log(score)
    passwordStrength.classList.remove('hidden')
    strengthfill.classList.remove('strong')
    strengthfill.classList.remove('weak')
    strengthfill.classList.add('medium')

    strengthText.classList.remove('strong')
    strengthText.classList.remove('weak')
    strengthText.classList.add('medium')
    strengthText.textContent = `medium`
  } else {
    console.log(score)
    passwordStrength.classList.remove('hidden')
    strengthfill.classList.remove('medium')
    strengthfill.classList.remove('weak')
    strengthfill.classList.add('strong')

    strengthText.classList.remove('medium')
    strengthText.classList.remove('weak')
    strengthText.classList.add('strong')
    strengthText.textContent = `strong`
  }

  if (password === ``) {
    passwordStrength.classList.add('hidden')
  }
}


// create account function
async function createAccount(email, password, userDetails) {
  try {
    createAcctText.textContent = ''
    signup_spinner.classList.remove('hidden')
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password)
    const uid = userCredentials.user.uid
    await saveUserDetailToDB(userDetails, uid)
    !postid ? window.location.href = `index.html`
      : window.location.href = `post.html?id=${postid}`
  }
  catch (error) {
    checktypeErrorAndDisplay(error.code)
  }
}

//save user details to db
async function saveUserDetailToDB(userDetail, uid) {
  try {
    await setDoc(doc(db, 'users', uid), userDetail)
  }
  catch (error) {
    console.log(error)
  }
}



// auto show signup page if start writng button is click
function autocall_signupPage() {
  const param = new URLSearchParams(window.location.search).get('mode')
  const sign = param
  if (sign === null) return
  switchSignin_signup(sign)
}
autocall_signupPage()

//signup button switch
signup.addEventListener('click', () => {
  let sign = 'signup'
  switchSignin_signup(sign)
})

// sign in button switch
signin.addEventListener('click', () => {
  let sign = 'sign in'
  switchSignin_signup(sign)
})



bottomBtn.addEventListener('click', () => {
  let sign = bottomBtn.textContent
  switchSignin_signup(sign)
})

// switch between signin page and signup page
function switchSignin_signup(sign) {
  if (sign === 'signup' || sign === 'Sign up free') {
    signin.classList.remove('active')
    signup.classList.add('active')
    signupForm.style.display = 'flex'
    signinForm.style.display = 'none'
    bottomText.textContent = 'Already have an acccount?'
    bottomBtn.textContent = 'sign in'
  } else if (sign === 'sign in') {
    signup.classList.remove('active')
    signin.classList.add('active')
    signinForm.style.display = 'flex'
    signupForm.style.display = 'none'
    bottomText.textContent = `Don't have an account?`
    bottomBtn.textContent = 'Sign up free'
  }
}


// START
const view_unview = document.querySelector('.js-toggle-signup-password')
const confirm_view_unview = document.querySelector('.js-toggle-confirm-password')
const signin_view_unview = document.querySelector('.js-toggle-signin-password')

const passwordfield = document.querySelector('.js-signup-password')
const confirmpasswordfield = document.querySelector('.js-signup-confirm')

const showIcon = document.querySelector('.js-show-icon')
const hideIcon = document.querySelector('.js-hide-icon')
const showIconCon = document.querySelector('.js-show-icon-con')
const hideIconCon = document.querySelector('.js-hide-icon-con')
const showIconsignIn = document.querySelector('.js-show-icon-signin')
const hideIconsignIn = document.querySelector('.js-hide-icon-signIn ')

signin_view_unview.addEventListener('click', () => {
  viewAndUnviewpassword(signinPassword, showIconsignIn, hideIconsignIn)
})

view_unview.addEventListener('click', () => {
  viewAndUnviewpassword(passwordfield, showIcon, hideIcon)
})


confirm_view_unview.addEventListener('click', () => {
  viewAndUnviewpassword(confirmpasswordfield, showIconCon, hideIconCon)
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


function checktypeErrorAndDisplay(error) {
  if (error === `auth/email-already-in-use`) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = 'Email already in use'

    setTimeout(() => {
      signupErrorAlert.classList.add('hidden')
    }, 3000)
    createAcctText.textContent = 'Create Account'
    signup_spinner.classList.add('hidden')
  }

  else if (error === `auth/missing-password`) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = `password field can't be empty`

    setTimeout(() => {
      signupErrorAlert.classList.add('hidden')
    }, 3000)
    createAcctText.textContent = 'Create Account'
    signup_spinner.classList.add('hidden')
  }
  else if (error === `auth/weak-password`) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = `weak password`

    setTimeout(() => {
      signupErrorAlert.classList.add('hidden')
    }, 3000)
    createAcctText.textContent = 'Create Account'
    signup_spinner.classList.add('hidden')
  }

  else if (error === `auth/invalid-email`) {
    signupErrorAlert.classList.remove('hidden')
    signupErrorAlert.textContent = `invalid email`

    setTimeout(() => {
      signupErrorAlert.classList.add('hidden')
    }, 3000)
    createAcctText.textContent = 'Create Account'
    signup_spinner.classList.add('hidden')
  }
  console.log(error)
}
