function setCookie(key, value, expiredays) {
  const exdate = new Date();
  exdate.setDate(exdate.getDate() + expiredays);
  document.cookie = `${key}=${escape(value)}${
    expiredays == null ? '' : `;expires=${exdate.toGMTString()}`
  }`;
}

function delCookie(name) {
  const exp = new Date();
  exp.setTime(exp.getTime() - 1);
  const cval = getCookie(name);
  if (cval != null) {
    document.cookie = `${name}=${cval};expires=${exp.toGMTString()}`;
  }
}

function getCookie(name) {
  let arr,
    reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
  if ((arr = document.cookie.match(reg))) {
    return arr[2];
  } else {
    return null;
  }
}
