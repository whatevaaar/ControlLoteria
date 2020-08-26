"use strict";

//Acceso a Firebase
var firebaseConfig = {
    apiKey: "AIzaSyD0tBlIt5byHbPahOMI4xIn7_oLc_Q2h88",
    authDomain: "loteriaec.firebaseapp.com",
    databaseURL: "https://loteriaec.firebaseio.com",
    projectId: "loteriaec",
    storageBucket: "loteriaec.appspot.com",
    messagingSenderId: "555164756181",
    appId: "1:555164756181:web:739d58626832ba8dd1da5c",
    measurementId: "G-31VB71L0ML"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//Bindings
const radioMazoNuevo = document.getElementById("radioMazoNuevo");
const radioMazoExistente = document.getElementById("radioMazoExistente");
const nombreInput = document.getElementById('inputNombre');
const inputNombreMazo = document.getElementById("inputNombreMazo");
const inputImg = document.getElementById("inputImg");
const selectBox = document.getElementById("opcionesMazo");
const imgNaipe = document.getElementById("img-naipe");

//Referencia de almacenaje para las imágnes en firebase
const refernciaAlmacenaje = firebase.storage().ref();

function conseguirMazos() {
    let selectBox = document.getElementById("opcionesMazo");
    firebase.database().ref("mazos").on("value", snap => {
        snap.forEach(element => {
            let dato = element.val();
            let opt = document.createElement('option');
            opt.value = element.key;
            opt.innerHTML = element.key;
            selectBox.appendChild(opt);
        });
    });
}

function subirCarta() {
    let nombre = inputNombre.value;
    let nombreMazo = radioMazoNuevo.checked ? inputNombreMazo.value : selectBox.value;
    // Upload file and metadata to the object 'images/mountains.jpg'
    let uploadTask = refernciaAlmacenaje.child('mazos/' + nombreMazo + '/' + nombre).put($('#inputImg').prop('files')[0]);
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
        function (snapshot) {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    break;
            }
        }, function (error) {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    break;
                case 'storage/unknown':
                    // Unknown error occurred, inspect error.serverResponse
                    break;
            }
        }, function () {
            // Upload completed successfully, now we can get the download URL
            uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                console.log('File available at', downloadURL);


                firebase.database().ref('mazos/' + nombreMazo + '/' + nombre).set({
                    nombre: nombre,
                    url: downloadURL
                }, function (error) {
                    if (error)
                        mostrarAlertaError();
                    else {
                        mostrarAlertaExito();
                        limpiarFormulario();
                    }
                });
            });
        });

}


function limpiarFormulario() {
    inputNombre.value = "";
    inputNombreMazo.value = "";
}


//Alertas
function mostrarAlertaExito() {
    $(document).ready(function () {
        $('.alert-succes').show();
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false; // Keep close.bs.alert event from removing from DOM
    });
}

function mostrarAlertaError() {
    $(document).ready(function () {
        $('.alert-danger').show();
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false; // Keep close.bs.alert event from removing from DOM
    });
}

//Preparar opciones
$(document).ready(function () {
    conseguirMazos();
    selectBox.disabled = true;
});
//Listener
$('input[type=radio][name=radioMazo]').change(function () {
    selectBox.disabled = !(this.value == 'existente');
    inputNombreMazo.disabled = !(this.value == 'nuevo');
});

$('input[type="file"]').change(function (e) {
    var fileName = e.target.files[0].name;
    $('.custom-file-label').html(fileName);
});

inputImg.onchange = function (evt) {
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            imgNaipe.src = fr.result;
        }
        fr.readAsDataURL(files[0]);
    }

    // Not supported
    else console.log("e");
}