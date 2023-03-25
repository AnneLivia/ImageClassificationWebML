// Executar quando html tiver sido carregado
document.addEventListener('DOMContentLoaded', async () => {
  // obtendo as divs
  const errorVideoDiv = document.querySelector('#errorVideo');
  const gestureIndicatorDiv = document.querySelector('#card-gesture-indicator');

  // botões
  const btUp = document.querySelector('#btUp');
  const btDown = document.querySelector('#btDown');
  const btLeft = document.querySelector('#btLeft');
  const btRight = document.querySelector('#btRight');

  const btTrain = document.querySelector('#btTrain');
  const btSave = document.querySelector('#btSave');

  // div de video e canvas
  const videoDiv = document.querySelector('#webcam');
  // para obter os pixels do video
  const webcamCanvas = document.querySelector('#webcamCanvas');
  const context = webcamCanvas.getContext('2d');

  // constantes para ser usada durante treinamento
  const VIDEO_CHANNELS = 4;
  const VIDEO_WIDTH = 640;
  const VIDEO_HEIGHT = 480;

  videoDiv.width = VIDEO_WIDTH;
  videoDiv.height = VIDEO_HEIGHT;

  // verificar se a webcam é suportada pelo browser
  if (navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoDiv.srcObject = stream;
      // exibindo video e card com indicação de gesto
      videoDiv.classList.remove('hide');
      gestureIndicatorDiv.classList.remove('hide');
      videoDiv.play();
    } catch (error) {
      errorVideoDiv.classList.remove('hide');
      errorVideoDiv.innerHTML =
        "<img src='./assets/images/no-video.png' alt='No video icon' />" +
        "<p class='mt-3'>Não foi possível acessar a sua Webcam</p>";

      console.error(error.message);
    }
  }

  // setup inicial da rede neural
  let options = {
    task: 'imageClassification',
    debug: true, // mostra visualização do treinamento
    inputs: [VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_CHANNELS],
  };

  // inicializar a rede neural
  const CNNClassifier = ml5.neuralNetwork(options);

  const getFramePixels = () => {
    // definindo altura e largura exata do canvas
    webcamCanvas.width = VIDEO_WIDTH;
    webcamCanvas.height = VIDEO_HEIGHT;

    // desenhando imagem do video no canvas para pegar os pixels
    context.drawImage(videoDiv, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    // getImage data retorna RGBA
    const imageData = context.getImageData(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    return [...imageData.data];
  };

  const addNewTrainData = (label) => {
    // colocando apenas pixels da imagem
    let input = { image: getFramePixels() };
    let target = { label };

    console.log(`Exemplo de ${label} adicionado`);

    // adicionando dado na rede neural
    CNNClassifier.addData(input, target);
  };

  const classifyImage = () => {
    let input = { image: getFramePixels() };
    CNNClassifier.classify(input, getResults);
  };

  const getResults = (error, results) => {
    if (error) {
      console.log(error.message);
      return;
    }
    console.log(results);
    classifyImage();
  };

  btUp.addEventListener('click', () => {
    addNewTrainData('up');
  });

  btDown.addEventListener('click', () => {
    addNewTrainData('Down');
  });

  btLeft.addEventListener('click', () => {
    addNewTrainData('Left');
  });

  btRight.addEventListener('click', () => {
    addNewTrainData('Right');
  });

  btTrain.addEventListener('click', () => {
    CNNClassifier.normalizeData();
    CNNClassifier.train(
      {
        epochs: 3,
      },
      () => {
        console.log('Treinamento finalizado');
        classifyImage();
      }
    );
  });

  btSave.addEventListener('click', () => {
    CNNClassifier.saveData();
  });
});
