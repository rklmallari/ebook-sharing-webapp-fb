'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const nodemailer = require('nodemailer');
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

const APP_NAME = 'eBookShare Web Application';

exports.sendWelcomeEmail = functions.auth.user().onCreate(event => {
  const user = event.data;
  const email = user.email;
  const displayName = user.displayName;

  return sendWelcomeEmail(email, displayName);
});

function sendWelcomeEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email
  };

  mailOptions.subject = `Welcome to ${APP_NAME}!`;
  mailOptions.text = `Hey ${displayName || ''}! Welcome to ${APP_NAME}. This is just a test email to apply cloud functions on the eBookShare web application. Thank you for logging in!`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('A welcome email was sent to:', email);
  });
}

exports.deleteAccount = functions.database.ref('/authors/{uid}').onDelete(event => {
  const authors = event.data.val();
  const authorId = event.params.uid;
  console.log("Delete author accounts.");
  var bookRef = admin.database().ref('/books');
  console.log("Entered /books");

  /*var bookTestRef = admin.database().ref('/books');
  bookTestRef.orderByChild('authorId').equalTo('author1').on('value', function(s) {
    console.log("snapshot value: " + s.val());

    try {
      console.log("toJSON snapshot: " + s.toJSON());
      console.log("toJSON snapshotval: " + s.val().toJSON());
    } catch (e) {
      console.error(e);
    }
  });*/
  
  bookRef.orderByChild('authorId').equalTo(authorId).on('value', function(snap) {
    console.log("toJSON snapshot: " + snap.toJSON());
    snap.forEach(function(snapshot) {
      bookRef.child(snapshot.key).remove()
        .then(snaps => {
          console.log("Books from the account have been deleted.");
        })
        .catch(e => {
          console.log(e.message);
        });
    });
  });

  var mainRef = admin.database().ref('/bookAuthorMap');
  return mainRef.child(authorId).remove()
    .then(snaps => {
      console.log("Related entries for the account have been deleted.");
    })
    .catch(e => {
      console.log(e.message);
    });
});