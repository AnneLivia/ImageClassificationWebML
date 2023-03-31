// Executar quando html tiver sido carregado
document.addEventListener('DOMContentLoaded', async () => {
  // div para exibir mensagem de erro caso a webcam não possa ser executada pelo browser
  const errorVideoIndicatorArea = document.querySelector(
    '#errorVideoIndicatorArea'
  );

  // div para exibir feedbacks gerais da aplicação como modelo pronto, modelo carregado, etc.
  const modelFeedbackIndicatorArea = document.querySelector(
    '#modelFeedbackIndicatorArea'
  );

  // card referente a inserção de exemplo
  const insertNewExamplesArea = document.querySelector(
    '#insertNewExamplesArea'
  );

  // card referente a exibição das classes detectadas
  const detectedGestureIndicatorArea = document.querySelector(
    '#detectedGestureIndicatorArea'
  );

  // para mostrar a imagem das classes detectadas
  const recognizedClassImage = document.querySelector('#recognizedClassImage');

  // div de video para exibição da webcam
  const video = document.querySelector('#webcam');

  // referencia para todos os botões de exemplos
  const btUp = document.querySelector('#btAddExampleUp');
  const btDown = document.querySelector('#btAddExampleDown');
  const btLeft = document.querySelector('#btAddExampleLeft');
  const btRight = document.querySelector('#btAddExampleRight');
  const btNegative = document.querySelector('#btAddExampleNegative');

  // botões para manipulação do modelo
  const btTrainModel = document.querySelector('#btTrainModel');
  const btSaveModel = document.querySelector('#btSaveModel');
  const btLoadModel = document.querySelector("#btLoadModel");

  // botões para iniciar classificação e parar caso haja modelo treinado ou carregado
  const btStartClassification = document.querySelector(
    '#btStartClassification'
  );
  const btStoplassification = document.querySelector('#btStoplassification');

  // input referente a inserção dos arquivos do modelo baixado (model e weights)
  const modelDataFiles = document.querySelector("#modelDataFiles");

  // loading spinner
  const loading = document.querySelector('#loading');

  // para mostrar quantidade de exemplos inseridos
  // cada key possui a quantidade para concatenar na medida em que novos itens
  // são inseridos e o documento referente ao span para exibição do número na interface
  const totalExamplesAddedToTrain = {
    up: { 
      quantity: 0, 
      document: document.querySelector('#numberExamplesUp') 
    },
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

  // variavel para contatenar o total geral de exemplos
  let overallTotal = 0;
  // variavel para determinar se é para classificar (quando iniciar classificao for precionada) ou
  // parar classificação (quando botão correspondente a essa opção for acionado)
  let shouldClassify = false;
  // para deteminar se um modelo foi carregado, se esse for o caso então deve-se permitir iniciar classificação com ele
  let modelLoaded = false;

  // para precionar as arrow keys
  const keys = {
    up: new KeyboardEvent('keydown', {
      key: 'ArrowUp'
    }),
    down: new KeyboardEvent('keydown', {
      key: 'ArrowDown'
    }),
  
    left: new KeyboardEvent('keydown', {
      key: 'ArrowLeft'
    }),
    right: new KeyboardEvent('keydown', {
      key: 'ArrowRight'
    }),
  }
  

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

  // opção customizadas do modelo (hiperparametros), existem outras opções para manipular
  const CLASSIFIER_OPTIONS = {
    hiddenUnits: 100,
    epochs: 30,
    numLabels: 5,
  };

  // Primeiro passo de transfer learning é extrair features já aprendidas do MobileNet
  const featureExtractor = ml5.featureExtractor('MobileNet', CLASSIFIER_OPTIONS, () => {
    console.log('Modelo carregado!');
  });

  // criando um modelo que usa essa caracteristicas e passando o video que é onde será
  // obtidos os exemplos para treinamento e classificação
  const CustomModelClassifier = featureExtractor.classification(video, () => {
    console.log('Vídeo iniciado com sucesso!');
  });

  const addNewTrainData = async (label) => {
    // incrementando a quantidade de uma label especifica e já exibido na tela
    totalExamplesAddedToTrain[label].document.innerText =
      ++totalExamplesAddedToTrain[label].quantity;

    overallTotal += 1;

    // adicionando exemplo (frame) na rede neural
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
    // 2 imagens ou menos é muito pouco para treinamento. Deve-se ter mais que isso
    // Quanto mais imagens melhor.
    if (overallTotal <= 2) {
      // Se entrou aqui, deve retirar o hide da parte de feedback (exibir div que estava escondida)
      // e exibir mensagem de erro.
      modelFeedbackIndicatorArea.classList.remove('hide');
      return (modelFeedbackIndicatorArea.innerText =
        'Insira mais imagens para treinamento');
    }

    // para mostrar o loading spinner
    loading.classList.remove('hide');
    // para esconder area de feedback se estiver visivel
    modelFeedbackIndicatorArea.classList.add('hide');

    CustomModelClassifier.train((loss) => {
      // ainda em treinamento
      if (loss !== null) console.log(`Loss: ${loss}`);
      else {
        // quando finalizar, esconder loading spinner de novo
        console.log('Treinamento finalizado');
        loading.classList.add('hide');
        // exibir na area de feedback do modelo, a mensagem do modelo pronto para uso
        modelFeedbackIndicatorArea.classList.remove('hide');
        modelFeedbackIndicatorArea.innerText = 'O Modelo está pronto';
      }
    });
  });

  btSaveModel.addEventListener('click', () => {
    // so salvar model, se houver algum modelo customizado
    if (CustomModelClassifier.customModel) return CustomModelClassifier.save();

    modelFeedbackIndicatorArea.classList.remove('hide');
    modelFeedbackIndicatorArea.innerText =
      'Treine um novo modelo antes de salvar';
  });

  // metodo usado para controlar as arrow keys do teclado
  const controlArrowKeysBasedOnALabel = (label) => {
    // se não for a classe negativa, pode executar porque é a arrow key
    if (label !== 'negative')  {
      console.log(document.dispatchEvent(keys[label]));
      document.dispatchEvent(keys[label]);
  }
  }

  // metodo usado dentro de classify para exibir resultado ou erro caso haja algum
  const getLabelsReturnedFromModel = (error, results) => {
    if (error) {
      return console.log(error.message);
    }

    // controlando tecla
    controlArrowKeysBasedOnALabel(results[0].label);

    // ao reconhecer alguma classe, colocar a imagem especifica
    recognizedClassImage.src = `./assets/images/${results[0].label}.png`;

    console.log(`Label: ${results[0].label} - ${results[0].confidence}`);

    // se usuário não tiver apertado em parar classificação, continuar em loop
    if (shouldClassify)
      CustomModelClassifier.classify(getLabelsReturnedFromModel);
  };

  btStartClassification.addEventListener('click', () => {
    // se modelo customizado existe ou usuário colocou algum outro modelo, deve-se iniciar classificiação
    if (CustomModelClassifier.customModel || modelLoaded) {
      // para ficar em loop a classificação
      shouldClassify = true;
      // para mostrar os resultados da classificação com imagens e escoder a área referente ao treinamento
      detectedGestureIndicatorArea.classList.remove('hide');
      insertNewExamplesArea.classList.add('hide');
      return CustomModelClassifier.classify(getLabelsReturnedFromModel);
    }

    // se chegou aqui é porque não existe modelo para ser usado.
    modelFeedbackIndicatorArea.classList.remove('hide');
    modelFeedbackIndicatorArea.innerText =
      'Treine um novo modelo antes de iniciar a classificação';
  });

  btStoplassification.addEventListener('click', () => {
    // esconde card de exibição de resultados e exibe card para efetuar treinamento
    detectedGestureIndicatorArea.classList.add('hide');
    insertNewExamplesArea.classList.remove('hide');
    // evita que o loop de classificação continue
    shouldClassify = false;
  });

  // botão que abri janela para inserção de arquivos do modelo
  btLoadModel.addEventListener('click', () => {
    modelDataFiles.click(); 
  });
  
  modelDataFiles.addEventListener('change', async (e) => {
      if (CustomModelClassifier) {
        modelFeedbackIndicatorArea.classList.remove('hide');
        try {
          // passando os arquivos weights e model.json
          await CustomModelClassifier.load(e.target.files);
          // informando que modelo foi carregado na interface
          modelFeedbackIndicatorArea.innerText = 'Modelo carregado com sucesso';
          // para permitir que o modelo carregado possa ser usado na classificação em loop quando
          // usuario clicar em classificar
          modelLoaded = true;
        } catch (error) {
          modelFeedbackIndicatorArea.innerText = 'Erro ao carregar o modelo';
          console.log(error);
        }
      }
    });
});
