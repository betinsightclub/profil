from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def load_json(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def save_json(path, data):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def patch_text(path, old, new):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    if new in text:
        return False
    if old not in text:
        raise SystemExit(f'marker missing in {path}: {old!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')
    return True

# 1) Ensure the hard-coded Academy/Resources pages participate in scoped i18n.
patch_text(
    'assets/i18n/core-v2.js',
    '    "wallet": "wallet",\n',
    '    "wallet": "wallet",\n    "ressourcen": "resources",\n    "academy": "academy",\n    "werbematerial": "werbematerial",\n'
)
patch_text(
    'assets/i18n/member-completion.js',
    '    wallet:"wallet",\n',
    '    wallet:"wallet",\n    ressourcen:"resources",\n    academy:"academy",\n    werbematerial:"werbematerial",\n'
)

# 2) Portuguese Support locale. The page already uses data-bi-i18n keys; it only lacked PT.
support_pt = {
  "supportPage": {
    "title": "Suporte | BetInsight Club",
    "refresh": "↻ Atualizar",
    "eyebrow": "Ajuda e contato",
    "intro": "Aqui você pode abrir um ticket de suporte, ver seus tickets abertos e continuar respondendo dentro de um ticket. No máximo dois tickets podem ficar abertos ao mesmo tempo.",
    "secureTitle": "Acesso seguro ao suporte",
    "secureCopy": "O suporte usa localmente neste dispositivo o seu acesso confirmado ao dashboard. Ele não é inserido em novos links do navegador.",
    "checking": "Verificando conexão …",
    "noAccessTitle": "Acesso ao suporte indisponível",
    "noAccessCopy": "Abra seu perfil pessoal BetInsight e acesse o suporte novamente a partir dele.",
    "toProfile": "Ir para o perfil",
    "openTickets": "Tickets abertos",
    "freeSlots": "Vagas disponíveis",
    "maximum": "Máximo simultâneo",
    "closedTickets": "Tickets encerrados",
    "myOpen": "Meus tickets abertos",
    "openCopy": "Clique em um ticket para abrir o histórico da conversa.",
    "newTicket": "＋ Novo ticket",
    "closedHeading": "Tickets encerrados",
    "closedCopy": "Casos de suporte concluídos continuam disponíveis para leitura.",
    "closeThread": "Fechar ticket",
    "replyPlaceholder": "Sua resposta …",
    "sendReply": "Enviar resposta",
    "footer": "© 2026 BetInsight Club · API de suporte UUID isolada",
    "modalTitle": "Novo ticket de suporte",
    "modalCopy": "Descreva sua solicitação da forma mais clara possível.",
    "closeModal": "Fechar janela",
    "subject": "Assunto",
    "category": "Categoria",
    "catGeneral": "Geral",
    "catAccount": "Conta e perfil",
    "catUnits": "Units e pagamento",
    "catTips": "Dicas e resultados",
    "catNetwork": "Rede e comissões",
    "catExchange": "Casa de câmbio",
    "catTechnical": "Problema técnico",
    "message": "Mensagem",
    "cancel": "Cancelar",
    "submit": "Enviar ticket",
    "emptyResponse": "Resposta vazia do servidor.",
    "invalidResponse": "Não foi possível ler a resposta do servidor.",
    "requestFailed": "A solicitação ao suporte falhou.",
    "noSupportAccess": "Sem acesso ao suporte",
    "closedStatus": "ENCERRADO",
    "openStatus": "ABERTO",
    "ticketDefault": "Ticket de suporte",
    "newAnswer": "NOVA RESPOSTA",
    "newAnswers": "{{count}} NOVAS RESPOSTAS",
    "noClosed": "Ainda não há tickets encerrados",
    "noOpen": "Nenhum ticket de suporte aberto",
    "noClosedCopy": "Casos de suporte concluídos aparecerão aqui mais tarde.",
    "noOpenCopy": "Você pode enviar uma solicitação em “Novo ticket”.",
    "connected": "Conexão segura",
    "updated": "Dados de suporte atualizados.",
    "connectionFailed": "Falha na conexão",
    "loadFailed": "Não foi possível carregar os dados de suporte.",
    "noMessages": "Ainda não há mensagens",
    "you": "Você",
    "ticket": "Ticket",
    "threadLoading": "Carregando conversa …",
    "closedPrefix": "Encerrado · ",
    "openPrefix": "Aberto · ",
    "threadFailed": "Não foi possível carregar a conversa.",
    "subjectMin": "Digite um assunto com pelo menos 2 caracteres.",
    "messageMin": "Escreva uma mensagem com pelo menos 2 caracteres.",
    "sendingTicket": "Enviando ticket …",
    "created": "Seu ticket de suporte foi criado com segurança.",
    "createFailed": "Não foi possível criar o ticket.",
    "replyMin": "Escreva pelo menos 2 caracteres.",
    "sendingReply": "Enviando resposta …",
    "replyAdded": "Sua resposta foi adicionada com segurança.",
    "replyFailed": "Não foi possível enviar a resposta."
  }
}
save_json('assets/i18n/pages/support/pt.json', support_pt)

# 3) Academy/Resources dictionaries. These pages are legacy hard-coded HTML;
# member-completion pairs exact DE/PT values by matching keys.
resources_de = {"resourcesPage": {
  "title":"Academy & Ressourcen | BetInsight Club",
  "back":"← Zum Dashboard",
  "eyebrow":"Wissen · Vorlagen · Downloads",
  "intro":"Alles zum Lernen und Weitergeben an einem klaren Ort. Die Academy erklärt BetInsight Schritt für Schritt. Unter Werbematerial & Downloads findest du freigegebene Präsentationen, Bilder und weitere Materialien.",
  "academy":"BetInsight Academy",
  "academyCopy":"Verstehe die wichtigsten Funktionen in deinem Tempo – mit Schritt-für-Schritt-Anleitungen, PDF-Guides und passenden Videos.",
  "academyPoint1":"Einfacher Einstieg für neue Mitglieder",
  "academyPoint2":"Anleitungen direkt ansehen oder speichern",
  "academyPoint3":"Neue Academy-Inhalte zentral an einer Stelle",
  "academyOpen":"Academy öffnen",
  "marketing":"Werbematerial & Downloads",
  "marketingCopy":"Freigegebene BetInsight-Materialien für Präsentation, Social Media, Empfehlungen und Partnerkommunikation.",
  "marketingPoint1":"Geschäftspräsentation und PDF-Downloads",
  "marketingPoint2":"Bilder, Grafiken und Social-Media-Motive",
  "marketingPoint3":"Videos und weitere Partnerressourcen",
  "downloadsOpen":"Downloads öffnen"
}}
resources_pt = {"resourcesPage": {
  "title":"Academy e recursos | BetInsight Club",
  "back":"← Voltar ao painel",
  "eyebrow":"Conhecimento · Modelos · Downloads",
  "intro":"Tudo para aprender e compartilhar em um só lugar. A Academy explica a BetInsight passo a passo. Em Material de divulgação e downloads você encontra apresentações, imagens e outros materiais aprovados.",
  "academy":"BetInsight Academy",
  "academyCopy":"Entenda as funções mais importantes no seu ritmo, com instruções passo a passo, guias em PDF e vídeos adequados.",
  "academyPoint1":"Entrada simples para novos membros",
  "academyPoint2":"Ver ou salvar instruções diretamente",
  "academyPoint3":"Novos conteúdos da Academy reunidos em um só lugar",
  "academyOpen":"Abrir Academy",
  "marketing":"Material de divulgação e downloads",
  "marketingCopy":"Materiais BetInsight aprovados para apresentações, redes sociais, indicações e comunicação com parceiros.",
  "marketingPoint1":"Apresentação comercial e downloads em PDF",
  "marketingPoint2":"Imagens, gráficos e materiais para redes sociais",
  "marketingPoint3":"Vídeos e outros recursos para parceiros",
  "downloadsOpen":"Abrir downloads"
}}
save_json('assets/i18n/pages/resources/de.json', resources_de)
save_json('assets/i18n/pages/resources/pt.json', resources_pt)

academy_de = {"academyPage": {
  "title":"BetInsight Academy | BetInsight Club",
  "back":"← Academy & Ressourcen",
  "heading":"Lerne BetInsight Schritt für Schritt kennen.",
  "intro":"Kurze Anleitungen, verständliche PDFs und passende Videos helfen dir beim Einstieg. Neue Academy-Dokumente werden automatisch ergänzt.",
  "contents":"Academy-Inhalte",
  "contentsCopy":"Starte mit der Registrierung und öffne die Anleitung so, wie es für dich am besten passt: direkt als PDF, als Download oder – wenn vorhanden – als Video.",
  "loading":"Lädt …",
  "loadingCopy":"Academy-Inhalte werden geladen …",
  "loadError":"Die Academy-Inhalte konnten gerade nicht automatisch geladen werden. Bitte die Seite später erneut öffnen.",
  "empty":"Noch keine Academy-PDF vorhanden.",
  "simpleTitle":"📘 Verständlich aufgebaut",
  "simpleCopy":"Die Academy ist als Lernbereich gedacht – nicht als Vertriebsmaterial. Inhalte erklären Funktionen und Abläufe in klaren Schritten.",
  "expandTitle":"🔄 Automatisch erweiterbar",
  "expandCopy":"Weitere freigegebene PDF-Anleitungen erscheinen künftig automatisch auf dieser Seite.",
  "directTitle":"📥 Direkt verfügbar",
  "directCopy":"PDFs können direkt angesehen oder gespeichert werden. So hast du die Anleitung jederzeit griffbereit.",
  "registration":"Registrierung bei BetInsight – Schritt für Schritt",
  "registrationCopy":"Die vorhandene BetInsight-Anleitung führt Schritt für Schritt durch die Registrierung.",
  "approved":"Freigegebene BetInsight Academy-Anleitung.",
  "video":"▶ Video ansehen",
  "pdfView":"PDF ansehen",
  "pdfDownload":"PDF herunterladen",
  "unavailable":"Nicht erreichbar",
  "onePdf":"1 PDF verfügbar",
  "pdfCount":"{{count}} PDFs verfügbar"
}}
academy_pt = {"academyPage": {
  "title":"BetInsight Academy | BetInsight Club",
  "back":"← Academy e recursos",
  "heading":"Conheça a BetInsight passo a passo.",
  "intro":"Instruções curtas, PDFs fáceis de entender e vídeos adequados ajudam você a começar. Novos documentos da Academy são adicionados automaticamente.",
  "contents":"Conteúdos da Academy",
  "contentsCopy":"Comece pelo cadastro e abra cada instrução da forma que preferir: diretamente em PDF, como download ou, quando disponível, em vídeo.",
  "loading":"Carregando …",
  "loadingCopy":"Carregando conteúdos da Academy …",
  "loadError":"Não foi possível carregar automaticamente os conteúdos da Academy agora. Abra a página novamente mais tarde.",
  "empty":"Ainda não há PDF da Academy disponível.",
  "simpleTitle":"📘 Estrutura fácil de entender",
  "simpleCopy":"A Academy foi criada como área de aprendizagem, não como material de vendas. Os conteúdos explicam funções e processos em passos claros.",
  "expandTitle":"🔄 Expansão automática",
  "expandCopy":"Novos guias em PDF aprovados aparecerão automaticamente nesta página.",
  "directTitle":"📥 Disponível diretamente",
  "directCopy":"Os PDFs podem ser visualizados ou salvos diretamente, para que você tenha as instruções sempre à mão.",
  "registration":"Cadastro na BetInsight – passo a passo",
  "registrationCopy":"O guia disponível da BetInsight conduz você passo a passo pelo cadastro.",
  "approved":"Guia aprovado da BetInsight Academy.",
  "video":"▶ Assistir ao vídeo",
  "pdfView":"Ver PDF",
  "pdfDownload":"Baixar PDF",
  "unavailable":"Indisponível",
  "onePdf":"1 PDF disponível",
  "pdfCount":"{{count}} PDFs disponíveis"
}}
save_json('assets/i18n/pages/academy/de.json', academy_de)
save_json('assets/i18n/pages/academy/pt.json', academy_pt)

marketing_de = {"marketingMaterialsPage": {
  "title":"Werbematerial & Downloads | BetInsight Club",
  "back":"← Academy & Ressourcen",
  "eyebrow":"Freigegebene Partnerressourcen",
  "heading":"Werbematerial & Downloads",
  "intro":"Hier findest du freigegebene BetInsight-Materialien übersichtlich an einem Ort: Präsentationen, Social-Media-Motive, Videos, Werbetexte und weitere Partnerressourcen.",
  "navAria":"Werbematerial Bereiche",
  "businessQuick":"📄 Geschäftspräsentation",
  "businessQuickCopy":"Offizielle PDF direkt öffnen oder speichern.",
  "imagesQuick":"📱 Bilder & Grafiken",
  "imagesQuickCopy":"Freigegebene Motive nach Format sortiert ansehen.",
  "videosQuick":"🎬 Videos & Reels",
  "videosQuickCopy":"Freigegebene Werbevideos für Social Media.",
  "textsQuick":"✍️ Texte & Vorlagen",
  "textsQuickCopy":"Freigegebene Werbetexte direkt mit einem Klick kopieren.",
  "business":"Geschäftspräsentation",
  "businessCopy":"Die offizielle BetInsight-Geschäftspräsentation zum direkten Ansehen oder Herunterladen.",
  "pdfAvailable":"PDF verfügbar",
  "businessName":"BetInsight Geschäftspräsentation",
  "businessNameCopy":"Offizielle Präsentation zum Ansehen oder Herunterladen.",
  "pdfView":"PDF ansehen",
  "pdfDownload":"PDF herunterladen",
  "images":"Bilder & Grafiken",
  "imagesCopy":"Alle freigegebenen Motive sind übersichtlich nach Hochformat, Quadrat und Querformat sortiert. Der Download bleibt immer die Originaldatei.",
  "loading":"Lädt …",
  "materialsLoading":"Werbematerial wird geladen …",
  "imagesError":"Bilder konnten gerade nicht geladen werden.",
  "imagesEmpty":"Noch keine Bilder vorhanden.",
  "portrait":"Hochformat",
  "square":"Quadrat",
  "landscape":"Querformat",
  "videos":"Videos & Reels",
  "texts":"Texte & Vorlagen",
  "copyText":"Text kopieren",
  "copied":"Kopiert ✓",
  "approvedOnly":"Bitte nur freigegebenes BetInsight-Material verwenden.",
  "oneImage":"1 Bild",
  "imageCount":"{{count}} Bilder",
  "zeroImages":"0 Bilder",
  "unavailable":"Nicht erreichbar"
}}
marketing_pt = {"marketingMaterialsPage": {
  "title":"Material de divulgação e downloads | BetInsight Club",
  "back":"← Academy e recursos",
  "eyebrow":"Recursos aprovados para parceiros",
  "heading":"Material de divulgação e downloads",
  "intro":"Aqui você encontra, em um só lugar, materiais BetInsight aprovados: apresentações, peças para redes sociais, vídeos, textos promocionais e outros recursos para parceiros.",
  "navAria":"Áreas de material de divulgação",
  "businessQuick":"📄 Apresentação comercial",
  "businessQuickCopy":"Abra ou salve o PDF oficial diretamente.",
  "imagesQuick":"📱 Imagens e gráficos",
  "imagesQuickCopy":"Veja os materiais aprovados organizados por formato.",
  "videosQuick":"🎬 Vídeos e Reels",
  "videosQuickCopy":"Vídeos promocionais aprovados para redes sociais.",
  "textsQuick":"✍️ Textos e modelos",
  "textsQuickCopy":"Copie textos promocionais aprovados com um clique.",
  "business":"Apresentação comercial",
  "businessCopy":"A apresentação comercial oficial da BetInsight para visualizar ou baixar diretamente.",
  "pdfAvailable":"PDF disponível",
  "businessName":"Apresentação comercial BetInsight",
  "businessNameCopy":"Apresentação oficial para visualizar ou baixar.",
  "pdfView":"Ver PDF",
  "pdfDownload":"Baixar PDF",
  "images":"Imagens e gráficos",
  "imagesCopy":"Todos os materiais aprovados são organizados por formato vertical, quadrado e horizontal. O download sempre mantém o arquivo original.",
  "loading":"Carregando …",
  "materialsLoading":"Carregando material de divulgação …",
  "imagesError":"Não foi possível carregar as imagens agora.",
  "imagesEmpty":"Ainda não há imagens disponíveis.",
  "portrait":"Vertical",
  "square":"Quadrado",
  "landscape":"Horizontal",
  "videos":"Vídeos e Reels",
  "texts":"Textos e modelos",
  "copyText":"Copiar texto",
  "copied":"Copiado ✓",
  "approvedOnly":"Use somente materiais BetInsight aprovados.",
  "oneImage":"1 imagem",
  "imageCount":"{{count}} imagens",
  "zeroImages":"0 imagens",
  "unavailable":"Indisponível"
}}
save_json('assets/i18n/pages/werbematerial/de.json', marketing_de)
save_json('assets/i18n/pages/werbematerial/pt.json', marketing_pt)

# 4) Exact-string aliases for legacy sell page wording that does not match the existing keyed DE locale.
sell_de = load_json('assets/i18n/pages/sell/de.json')
sell_pt = load_json('assets/i18n/pages/sell/pt.json')
sell_aliases = {
  "legacyEyebrow": ("Unit-Wechselstube", "Casa de câmbio de Units"),
  "legacyIntro": ("Stelle vorhandene Units zum Verkauf ein und entscheide, ob Käufer per Krypto, Banküberweisung oder über beide Wege zahlen dürfen.", "Coloque suas Units disponíveis à venda e escolha se os compradores podem pagar com cripto, transferência bancária ou pelas duas formas."),
  "legacyNewOffer": ("Neues Verkaufsangebot", "Nova oferta de venda"),
  "legacyOwned": ("Es können nur Units angeboten werden, die dein Account tatsächlich besitzt.", "Só podem ser oferecidas Units que sua conta realmente possui."),
  "legacyChecking": ("Wird geprüft", "Verificando"),
  "legacyAmount": ("Verkaufsmenge", "Quantidade de venda"),
  "legacyUnitPrice": ("Verkaufspreis je Unit", "Preço de venda por Unit"),
  "legacyPayments": ("Welche Zahlungsarten möchtest du Käufern anbieten?", "Quais formas de pagamento você quer oferecer aos compradores?"),
  "legacyCrypto": ("🪙 Krypto", "🪙 Cripto"),
  "legacyCryptoCopy": ("Käufer zahlt direkt an deine gespeicherte Krypto-Wallet.", "O comprador paga diretamente para sua Wallet de cripto salva."),
  "legacyBank": ("🏦 Banküberweisung", "🏦 Transferência bancária"),
  "legacyBankCopy": ("Für den Käufer kommen pauschal 1,00 € Bank-Service hinzu. Dafür wird beim Einstellen 1 zusätzliche Unit reserviert.", "Para o comprador é acrescentado um serviço bancário fixo de 1,00 €. Por isso, 1 Unit adicional é reservada ao criar a oferta."),
  "legacySaleValue": ("Verkaufswert", "Valor da venda"),
  "legacyFee": ("Normale Verkaufsgebühr", "Taxa de venda normal"),
  "legacyBankReserve": ("Bank-Service-Reserve", "Reserva de serviço bancário"),
  "legacyRequired": ("Benötigter Unit-Bestand", "Saldo de Units necessário"),
  "legacyCryptoBuyer": ("Käufer zahlt bei Krypto", "Comprador paga com cripto"),
  "legacyBankBuyer": ("Käufer zahlt bei Bank", "Comprador paga por transferência bancária"),
  "legacyChoosePayment": ("Bitte wähle mindestens eine eingerichtete Zahlungsart aus.", "Selecione pelo menos uma forma de pagamento configurada."),
  "legacyWalletManage": ("Auszahlungsmethoden verwalten", "Gerenciar formas de recebimento"),
  "legacyRule1": ("Mindestens eine Zahlungsart muss ausgewählt sein.", "É necessário selecionar pelo menos uma forma de pagamento."),
  "legacyRule2": ("Bei Banküberweisung werden 1 € Käufer-Service und 1 zusätzliche Unit-Reserve verwendet.", "Na transferência bancária são usados 1 € de serviço ao comprador e 1 Unit adicional de reserva."),
  "legacyRule3": ("Die normale Verkaufsgebühr bleibt wie bisher bestehen.", "A taxa normal de venda permanece inalterada."),
  "legacyRule4": ("Geschenk-Units sind nicht verkaufbar.", "Gift Units não podem ser vendidas.")
}
for key, (de, pt) in sell_aliases.items():
    sell_de['sellPage'][key] = de
    sell_pt['sellPage'][key] = pt
save_json('assets/i18n/pages/sell/de.json', sell_de)
save_json('assets/i18n/pages/sell/pt.json', sell_pt)

# 5) Exact aliases for the exchange offers page visible in the PT screenshots.
offers_de = load_json('assets/i18n/pages/offers/de.json')
offers_pt = load_json('assets/i18n/pages/offers/pt.json')
offer_aliases = {
  "legacyBack": ("← Zurück", "← Voltar"),
  "legacyHero": ("Wähle Angebot und Zahlungsart", "Escolha a oferta e a forma de pagamento"),
  "legacyHeroCopy": ("Der Verkäufer legt fest, ob er Banküberweisung, Krypto oder beides akzeptiert. Du siehst die verfügbaren Zahlungsarten und den exakten Preis direkt auf jeder Karte.", "O vendedor define se aceita transferência bancária, cripto ou ambas. Você vê as formas de pagamento disponíveis e o preço exato diretamente em cada cartão."),
  "legacyTrust1": ("✓ Units serverseitig reserviert", "✓ Units reservadas no servidor"),
  "legacyTrust2": ("✓ Bank erst nach Verkäuferbestätigung", "✓ Banco somente após confirmação do vendedor"),
  "legacyTrust3": ("✓ Krypto mit Blockchain-Prüfung", "✓ Cripto com verificação na blockchain"),
  "legacySaleValue": ("Verkaufswert", "Valor da venda"),
  "legacyMyBuys": ("Meine Käufe", "Minhas compras"),
  "legacyMyBuysCopy": ("Deine letzten Wechselstuben-Käufe und ihr aktueller Bearbeitungsstatus.", "Suas compras mais recentes na Casa de câmbio e o status atual de processamento."),
  "legacyRefresh": ("↻ Aktualisieren", "↻ Atualizar"),
  "legacyPaymentSaleValue": ("Zahlbetrag / Verkaufswert", "Valor pago / valor da venda"),
  "legacyUnitPrice": ("Preis pro Unit", "Preço por Unit"),
  "legacyExpired": ("Abgelaufen", "Expirado"),
  "legacyMoreBuys": ("Weitere Käufe anzeigen", "Mostrar mais compras"),
  "legacyAllFinished": ("Alle angezeigten Vorgänge sind abgeschlossen oder beendet.", "Todos os processos exibidos foram concluídos ou encerrados."),
  "legacyBankSafety": ("Bei Banküberweisung werden die Units niemals allein durch den Klick des Käufers übertragen. Erst wenn der Verkäufer den tatsächlichen vollständigen Geldeingang bestätigt, löst das Backend den Unit-Transfer aus.", "Na transferência bancária, as Units nunca são transferidas apenas pelo clique do comprador. Somente quando o vendedor confirma o recebimento integral do valor é que o backend libera a transferência das Units."),
  "legacyFooter": ("Wechselstube", "Casa de câmbio")
}
for key, (de, pt) in offer_aliases.items():
    offers_de['offersPage'][key] = de
    offers_pt['offersPage'][key] = pt
save_json('assets/i18n/pages/offers/de.json', offers_de)
save_json('assets/i18n/pages/offers/pt.json', offers_pt)

# 6) My sale offers: static and dynamic German strings not covered by the original keyed file.
my_de = load_json('assets/i18n/pages/my-sale-offers/de.json')
my_pt = load_json('assets/i18n/pages/my-sale-offers/pt.json')
my_aliases = {
  "legacyIntro": ("Hier siehst du deine aktiven oder bereits für einen Käufer reservierten Verkaufsangebote. Aktive Angebote kannst du im Preis bearbeiten oder stornieren.", "Aqui você vê suas ofertas de venda ativas ou já reservadas para um comprador. Ofertas ativas podem ter o preço alterado ou ser canceladas."),
  "legacyCurrent": ("Aktuell im Verkauf", "Atualmente à venda"),
  "legacyCurrentCopy": ("Aktive und momentan reservierte Angebote.", "Ofertas ativas e atualmente reservadas."),
  "legacyLoading": ("Deine Verkaufsangebote werden geladen.", "Suas ofertas de venda estão sendo carregadas."),
  "legacyImportant": ("Wichtig:", "Importante:"),
  "legacyImportantCopy": ("Nur aktive Angebote können bearbeitet oder storniert werden. Sobald ein Käufer reserviert hat, sind Änderungen gesperrt. Bei Bankkäufen erscheint die Bestätigung erst, nachdem der Käufer die Zahlung als gesendet gemeldet hat. Bestätige den Geldeingang ausschließlich nach tatsächlichem vollständigem Eingang auf deinem Bankkonto. Erst dann werden die reservierten Units an den Käufer übertragen.", "Somente ofertas ativas podem ser alteradas ou canceladas. Assim que um comprador fizer a reserva, as alterações ficam bloqueadas. Em compras por transferência bancária, a confirmação só aparece depois que o comprador informar que enviou o pagamento. Confirme o recebimento apenas depois que o valor completo estiver realmente disponível em sua conta bancária. Só então as Units reservadas serão transferidas ao comprador."),
  "legacyNewOffer": ("Neues Verkaufsangebot erstellen", "Criar nova oferta de venda"),
  "legacyPrice": ("Preis pro Unit", "Preço por Unit"),
  "legacyTotal": ("Gesamtpreis", "Preço total"),
  "legacyReserved": ("Für Käufer reserviert", "Reservada para comprador"),
  "legacyActive": ("Aktiv im Verkauf", "Ativa à venda"),
  "legacyEdit": ("Bearbeiten", "Editar"),
  "legacyCancel": ("Stornieren", "Cancelar"),
  "legacyEmpty": ("Aktuell hast du keine eigenen Verkaufsangebote im Verkauf oder reserviert.", "No momento você não possui ofertas próprias à venda ou reservadas."),
  "legacyBankReserved": ("🏦 Bankkauf reserviert", "🏦 Compra bancária reservada"),
  "legacyBankCheck": ("Bankstatus wird geprüft …", "Verificando status bancário …")
}
for key, (de, pt) in my_aliases.items():
    my_de['mySaleOffersPage'][key] = de
    my_pt['mySaleOffersPage'][key] = pt
save_json('assets/i18n/pages/my-sale-offers/de.json', my_de)
save_json('assets/i18n/pages/my-sale-offers/pt.json', my_pt)

print('PT visible-gap repair prepared successfully')
