// Executar quando html tiver sido carregado
document.addEventListener('DOMContentLoaded', async () => {
  // obtendo as divs
  const errorVideoIndicatorArea = document.querySelector(
    '#errorVideoIndicatorArea'
  );

  const modelFeedbackIndicatorArea = document.querySelector(
    '#modelFeedbackIndicatorArea'
  );

  const insertNewExamplesArea = document.querySelector(
    '#insertNewExamplesArea'
  );

  const detectedGestureIndicatorArea = document.querySelector(
    '#detectedGestureIndicatorArea'
  );

  // para mostrar as classes detectadas
  const recognizedClassImage = document.querySelector('#recognizedClassImage');

  // div de video e canvas para obter os pixels do video
  const video = document.querySelector('#webcam');

  // referencia para todos os botões
  const btUp = document.querySelector('#btAddExampleUp');
  const btDown = document.querySelector('#btAddExampleDown');
  const btLeft = document.querySelector('#btAddExampleLeft');
  const btRight = document.querySelector('#btAddExampleRight');
  const btNegative = document.querySelector('#btAddExampleNegative');

  const btTrainModel = document.querySelector('#btTrainModel');
  const btSaveModel = document.querySelector('#btSaveModel');
  const btStartClassification = document.querySelector(
    '#btStartClassification'
  );

  const btLoadModel = document.querySelector("#btLoadModel");
  const modelDataFiles = document.querySelector("#modelDataFiles");

  const btStoplassification = document.querySelector('#btStoplassification');

  // loading
  const loading = document.querySelector('#loading');

  // para mostrar quantidade de exemplos inseridos
  const totalExamplesAddedToTrain = {
    up: { quantity: 0, document: document.querySelector('#numberExamplesUp') },
    left: {
      quantity: 0,
      document: document.querySelector('#numberExamplesLeft'),
    },
    right: {
      quantity: 0,
      document: document.querySelector('#numberExamplesRight'),
    },
    down: {
      quantity: 0,
      document: document.querySelector('#numberExamplesDown'),
    },
    negative: {
      quantity: 0,
      document: document.querySelector('#numberExamplesNegative'),
    },
  };

  let overallTotal = 0;
  let shouldClassify = false;
  let modelLoaded = false;

  // verificar se a webcam é suportada pelo browser
  if (navigator.mediaDevices.getUserMedia) {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      video.srcObject = videoStream;

      video.play();
      // exibindo video e card com indicação de gesto
      video.classList.remove('hide');
      insertNewExamplesArea.classList.remove('hide');
    } catch (error) {
      errorVideoIndicatorArea.classList.remove('hide');
      errorVideoIndicatorArea.innerHTML =
        "<img src='./assets/images/no-video.png' alt='No video icon' />" +
        "<p class='mt-3'>Não foi possível acessar a sua Webcam</p>";

      console.error(error.message);
    }
  }

  const CLASSIFIER_OPTIONS = {
    hiddenUnits: 100,
    epochs: 30,
    numLabels: 5,
  };

  // Primeiro passo de transfer learning é extrair features já aprendidas do MobileNet
  const featureExtractor = ml5.featureExtractor('MobileNet', CLASSIFIER_OPTIONS, () => {
    console.log('Modelo carregado!');
  });

  // criando um modelo que usa essa caracteristicas
  const CustomModelClassifier = featureExtractor.classification(video, () => {
    console.log('Vídeo iniciado com sucesso!');
  });

  const addNewTrainData = async (label) => {
    totalExamplesAddedToTrain[label].document.innerText =
      ++totalExamplesAddedToTrain[label].quantity;

    overallTotal += 1;

    // adicionando dado na rede neural
    CustomModelClassifier.addImage(label, () => {
      console.log(`Exemplo de ${label} adicionado`);
    });
  };

  btUp.addEventListener('click', () => {
    addNewTrainData('up');
  });

  btDown.addEventListener('click', () => {
    addNewTrainData('down');
  });

  btLeft.addEventListener('click', () => {
    addNewTrainData('left');
  });

  btRight.addEventListener('click', () => {
    addNewTrainData('right');
  });

  btNegative.addEventListener('click', () => {
    addNewTrainData('negative');
  });

  btTrainModel.addEventListener('click', () => {
    if (overallTotal <= 2) {
      modelFeedbackIndicatorArea.classList.remove('hide');
      return (modelFeedbackIndicatorArea.innerText =
        'Insira mais imagens para treinamento');
    }

    loading.classList.remove('hideButWithDivSpaceLeft');
    modelFeedbackIndicatorArea.classList.add('hide');
    CustomModelClassifier.train((loss) => {
      if (loss !== null) console.log(`Loss: ${loss}`);
      else {
        console.log('Treinamento finalizado');
        loading.classList.add('hideButWithDivSpaceLeft');
        modelFeedbackIndicatorArea.classList.remove('hide');
        modelFeedbackIndicatorArea.innerText = 'O Modelo está pronto';
      }
    });
  });

  btSaveModel.addEventListener('click', () => {
    if (CustomModelClassifier.customModel) return CustomModelClassifier.save();

    modelFeedbackIndicatorArea.classList.remove('hide');
    modelFeedbackIndicatorArea.innerText =
      'Treine um novo modelo antes de salvar';
  });

  const getLabelsReturnedFromModel = (error, results) => {
    if (error) {
      return console.log(error.message);
    }

    recognizedClassImage.src = `./assets/images/${results[0].label}.png`;

    console.log(`Label: ${results[0].label} - ${results[0].confidence}`);
    if (shouldClassify)
      CustomModelClassifier.classify(getLabelsReturnedFromModel);
  };

  btStartClassification.addEventListener('click', () => {
    if (CustomModelClassifier.customModel || modelLoaded) {
      shouldClassify = true;
      // para mostrar os resultados e escoder área para retreinamento
      detectedGestureIndicatorArea.classList.remove('hide');
      insertNewExamplesArea.classList.add('hide');
      return CustomModelClassifier.classify(getLabelsReturnedFromModel);
    }

    modelFeedbackIndicatorArea.classList.remove('hide');
    modelFeedbackIndicatorArea.innerText =
      'Treine um novo modelo antes de iniciar a classificação';
  });

  btStoplassification.addEventListener('click', () => {
    detectedGestureIndicatorArea.classList.add('hide');
    insertNewExamplesArea.classList.remove('hide');
    shouldClassify = false;
  });

  btLoadModel.addEventListener('click', () => {
    modelDataFiles.click(); 
  });
  

  modelDataFiles.addEventListener('change', async (e) => {
      if (CustomModelClassifier) {
        modelFeedbackIndicatorArea.classList.remove('hide');
        try {
          await CustomModelClassifier.load(e.target.files);
          modelFeedbackIndicatorArea.innerText = 'Modelo carregado com sucesso';
          modelLoaded = true;
        } catch (error) {
          modelFeedbackIndicatorArea.innerText = 'Erro ao carregar o modelo';
          console.log(error);
        }
      }
    });
});
