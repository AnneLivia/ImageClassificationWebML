// Executar quando html tiver sido carregado
document.addEventListener('DOMContentLoaded', async () => {

  // divs para controlar exibição de video
  const videoArea = document.querySelector('#videoArea');

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
  const btAddExampleILikeIt = document.querySelector('#btAddExampleILikeIt');
  const btAddExampleIDontLikeIt = document.querySelector('#btAddExampleIDontLikeIt');
  const btNegative = document.querySelector('#btAddExampleNegative');

  // botões para manipulação do modelo
  const btTrainModel = document.querySelector('#btTrainModel');
  const btSaveModel = document.querySelector('#btSaveModel');
  const btLoadModel = document.querySelector('#btLoadModel');

  // botões para iniciar classificação e parar caso haja modelo treinado ou carregado
  const btStartClassification = document.querySelector(
    '#btStartClassification'
  );
  const btStopClassification = document.querySelector('#btStopClassification');

  // input referente a inserção dos arquivos do modelo baixado (model e weights)
  const modelDataFiles = document.querySelector('#modelDataFiles');

  // loading spinner
  const loading = document.querySelector('#loading');

  // para mostrar quantidade de exemplos inseridos
  // cada key possui a quantidade para concatenar na medida em que novos itens
  // são inseridos e o documento referente ao span para exibição do número na interface
  const totalExamplesAddedToTrain = {
    ILikeIt: {
      quantity: 0,
      element: document.querySelector('#numberExamplesILikeIt'),
    },
    IDontLikeIt: {
      quantity: 0,
      element: document.querySelector('#numberExamplesIDontLikeIt'),
    },
    negative: {
      quantity: 0,
      element: document.querySelector('#numberExamplesNegative'),
    },
  };

  // variavel para contatenar o total geral de exemplos
  let overallTotal = 0;
  // variavel para determinar se é para classificar (quando iniciar classificao for precionada) ou
  // parar classificação (quando botão correspondente a essa opção for acionado)
  let shouldClassify = false;
  // para deteminar se um modelo foi carregado, se esse for o caso então deve-se permitir iniciar classificação com ele
  let modelLoaded = false;
  // para definir o número de exemplos a ser adicionado
  const MAX_IMAGENS_USED_TO_TRAIN = 150;

  // verificar se a webcam é suportada pelo browser
  if (navigator.mediaDevices.getUserMedia) {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      video.srcObject = videoStream;

      // deixando a imagem espelhada, através de um flip na horizontal
      video.style.webkitTransform = 'scaleX(-1)';
      video.style.transform = 'scaleX(-1)';

      video.play();
      // exibindo video e card com indicação de gesto
      video.classList.remove('hide');
      insertNewExamplesArea.classList.remove('hide');
    } catch (error) {
      errorVideoIndicatorArea.classList.remove('hide');
      errorVideoIndicatorArea.innerHTML =
        "<img src='./assets/images/no-video.png' alt='No video icon' />" +
        "<p class='mt-3'>Não foi possível acessar a sua Webcam</p>";

      // desabilitar botões de iniciar e parar classificação
      btStartClassification.disabled = true;
      btStopClassification.disabled = true;

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
  const featureExtractor = ml5.featureExtractor(
    'MobileNet',
    CLASSIFIER_OPTIONS,
    () => {
      console.log('Modelo carregado!');
    }
  );

  // criando um modelo que usa essa caracteristicas e passando o video que é onde será
  // obtidos os exemplos para treinamento e classificação
  const CustomModelClassifier = featureExtractor.classification(video, () => {
    console.log('Vídeo iniciado com sucesso!');
  });

  const addNewTrainData = async (label) => {
    // número máximo de exemplos
    if (overallTotal >= MAX_IMAGENS_USED_TO_TRAIN) {
      modelFeedbackIndicatorArea.classList.remove('hide');
      return (modelFeedbackIndicatorArea.innerText = `O número máximo de imagens para treinamento (${MAX_IMAGENS_USED_TO_TRAIN}) foi atingido`);
    }

    // incrementando a quantidade de uma label especifica e já exibido na tela
    totalExamplesAddedToTrain[label].element.innerText =
      ++totalExamplesAddedToTrain[label].quantity;

    overallTotal += 1;

    // adicionando exemplo (frame) na rede neural
    CustomModelClassifier.addImage(label, () => {
      console.log(`Exemplo de ${label} adicionado`);
    });
  };

  const btUsedToaddTrainData = [
    {
      element: btAddExampleIDontLikeIt,
      label: 'IDontLikeIt',
    },
    {
      element: btAddExampleILikeIt,
      label: 'ILikeIt',
    },
    {
      element: btNegative,
      label: 'negative',
    },
  ];

  // inserindo os eventos de inserir imagem para treinamnto quando mouse estiver sobre o botão
  btUsedToaddTrainData.forEach((btn) => {
    btn.element.addEventListener('click', () => {
      addNewTrainData(btn.label);
    });
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

  // metodo usado dentro de classify para exibir resultado ou erro caso haja algum
  const getLabelsReturnedFromModel = (error, results) => {
    if (error) {
      return console.log(error.message);
    }

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

  btStopClassification.addEventListener('click', () => {
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

  // Os Códigos abaixo incluem hover effects em todos os botões
  const listOfButtonsElementsToAddHover = [
    btTrainModel,
    btSaveModel,
    btLoadModel,
    btStartClassification,
    btStopClassification,
    btAddExampleIDontLikeIt,
    btAddExampleILikeIt,
    btNegative,
  ];

  listOfButtonsElementsToAddHover.forEach((element) => {
    const animation = 'fa-beat-fade';

    element.addEventListener('mouseover', () => {
      // obtendo primeiro elemento do botão que é o <i> e colocando a animação
      element.firstElementChild.classList.add(animation);
    });

    element.addEventListener('mouseout', () => {
      // obtendo primeiro elemento do botão que é o <i> e removendo a animação
      element.firstElementChild.classList.remove(animation);
    });
  });
});
