"use strict";
//Modelo
class Carta {
    constructor(nombre, url) {
        this.nombre = nombre;
        this.url = url;
    }
}

var listaDeCartas = [];
var idJuego = "";
var indexCartas = 0
const HISTORICO_MAX = 4

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
reconectarJuego();
conseguirHistorico();
//Bindings
const radioMazoNuevo = document.getElementById("radioMazoNuevo");
const radioMazoExistente = document.getElementById("radioMazoExistente");
const nombreInput = document.getElementById('inputNombre');
const inputNombreMazo = document.getElementById("inputNombreMazo");
const inputImg = document.getElementById("inputImg");
const imgNaipe = document.getElementById("imgNaipe");
const selectBoxCrearCarta = document.getElementById("opcionesMazo");
const selectBoxIniciarJuego = document.getElementById("opcionesMazoIniciar");
const selectBoxHistorico = document.getElementById("opcionesHistorico");
const botonSiguiente = document.getElementById("boton-siguiente");
const botonIniciar = document.getElementById("boton-iniciar");
const botonTerminar = document.getElementById("boton-terminar");
//Referencia de almacenaje para las imágnes en firebase
const refernciaAlmacenaje = firebase.storage().ref();

function reconectarJuego() {
    let conexion = firebase.database().ref('/juegos/').orderByChild("activo").equalTo(true)
    conexion.once('value', function (snapshot) {
        snapshot.forEach(element => {
            let child = element.val();
            idJuego = child.key;
            let mazo = child.mazo
            cambiarUIJuegoEnProceso();
            conseguirCartas(mazo);
        });
    });
}

function conseguirHistorico(){
    let conexion = firebase.database().ref('/juegos/').limitToLast(HISTORICO_MAX)
    conexion.once('value', function (snapshot) {
        snapshot.forEach(element => {
            let data = element.val();
            let opt = document.createElement('option');
            opt.value = element.key;
            opt.innerHTML = data.fecha;
            selectBoxHistorico.appendChild(opt);
        });
    });
}

function cambiarUIJuegoEnProceso() {
    botonSiguiente.disabled = false
    botonTerminar.disabled = false
    botonIniciar.disabled = true
    selectBoxIniciarJuego.disabled = true
}

function cambiarUIJuegoTerminado() {
    botonSiguiente.disabled = true
    botonTerminar.disabled = true
    botonIniciar.disabled = false
    selectBoxIniciarJuego.disabled = false
}
function conseguirMazos() {
    firebase.database().ref("mazos").on("value", snap => {
        snap.forEach(element => {
            let opt = document.createElement('option');
            opt.value = element.key;
            opt.innerHTML = element.key;
            selectBoxIniciarJuego.appendChild(opt);
        });
    });
}

function subirCarta() {
    let nombre = inputNombre.value;
    let nombreMazo = radioMazoNuevo.checked ? inputNombreMazo.value : selectBoxCrearCarta.value;
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

function iniciarJuego() {
    idJuego = firebase.database().ref().child('juegos').push().key;
    let mazo = selectBoxIniciarJuego.value;
    let fecha = new Date().toUTCString() 
    firebase.database().ref('juegos/' + idJuego).set({
        activo: true,
        mazo: mazo,
        key: idJuego,
        fecha: fecha 
    }, function (error) {
        if (error)
            mostrarAlertaError();
        else {
            mostrarAlertaExito();
            conseguirCartas(mazo);
            cambiarUIJuegoEnProceso();
        }
    });
}

function conseguirCartas(mazo) {
    firebase.database().ref("mazos/" + mazo).on("value", snap => {
        snap.forEach(element => {
            let child = element.val();
            let nombre = child.nombre;
            let url = child.url;
            listaDeCartas.push(new Carta(nombre, url));
        });
        shuffle(listaDeCartas);
        siguienteCarta();
    });
}

function siguienteCarta() {
    let updates = {};
    imgNaipe.src = listaDeCartas[indexCartas].url;
    updates['juegos/' + idJuego + '/carta-activa'] = listaDeCartas[indexCartas++];
    return firebase.database().ref().update(updates);
}

function terminarJuego() {
    let updates = {};
    updates['juegos/' + idJuego + '/activo'] = false;
    cambiarUIJuegoTerminado();
    return firebase.database().ref().update(updates);
}

function limpiarFormulario() {
    inputNombre.value = "";
    inputNombreMazo.value = "";
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
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
    selectBoxCrearCarta.disabled = true;
});
//Listener Radios
$('input[type=radio][name=radioMazo]').change(function () {
    selectBoxCrearCarta.disabled = !(this.value == 'existente');
    inputNombreMazo.disabled = !(this.value == 'nuevo');
});

$('input[type="file"]').change(function (e) {
    var fileName = e.target.files[0].name;
    $('.custom-file-label').html(fileName);
});

//Listener Img
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

//Listener botones
$("#boton-iniciar").click(iniciarJuego);
$("#boton-terminar").click(terminarJuego);
$("#boton-siguiente").click(siguienteCarta);