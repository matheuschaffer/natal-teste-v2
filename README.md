# ✨ Natal Mágico

Uma Single Page Application moderna e elegante para criar páginas de homenagem natalinaaa personalizadas.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animações)
- **Lucide React** (ícones)
- **Shadcn/UI** (componentes)

## 📦 Instalação

1. Instale as dependências:

```bash
npm install
```

2. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🎨 Características

- ✨ Design moderno e elegante com tema natalino
- 📱 **Mobile-First** - otimizado para dispositivos móveis
- 🎭 Animações suaves com Framer Motion
- ❄️ Efeito de neve sutil (pode ser desativado)
- 🤖 Assistente de IA para gerar mensagens
- 📸 Upload de fotos com drag & drop
- ⏰ Contador regressivo para o Natal

## 📝 Estrutura do Projeto

```
├── app/
│   ├── layout.tsx      # Layout principal
│   ├── page.tsx        # Página principal
│   └── globals.css     # Estilos globais
├── components/
│   ├── ui/             # Componentes Shadcn/UI
│   ├── CountdownTimer.tsx
│   ├── MessageGenerator.tsx
│   ├── PhotoUploader.tsx
│   └── SnowEffect.tsx
└── lib/
    └── utils.ts        # Utilitários
```

## 🎯 Funcionalidades

### 1. Título da Homenagem
- Input grande e centralizado
- Tipografia elegante (serifada)

### 2. Mensagem do Coração
- Textarea para mensagem personalizada
- Assistente de IA com 3 opções:
  - Gerar Emocionante
  - Gerar Engraçada
  - Gerar Poética
- Botões de Desfazer e Editar

### 3. Galeria da Família
- Upload de até 5 fotos
- Drag & drop
- Grid responsivo (masonry style)
- Remoção de fotos

### 4. Footer Sticky
- Botão premium para finalizar
- Fixo na parte inferior (mobile/desktop)

## 🎨 Design System

- **Cores principais:**
  - Vermelho profundo (Crimson): `#DC143C`
  - Dourado: `#D4AF37`
  - Branco: Base limpa

- **Tipografia:**
  - Títulos: Playfair Display (serifada)
  - Corpo: Inter (sans-serif)

- **Abordagem:** Mobile-First com bastante whitespace

## 📱 Responsividade

O projeto é totalmente responsivo e otimizado para:
- 📱 Mobile (prioridade)
- 💻 Tablet
- 🖥️ Desktop

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 📄 Licença

Este projeto é privado.

---

Feito com ❤️ para criar momentos mágicos de Natal

