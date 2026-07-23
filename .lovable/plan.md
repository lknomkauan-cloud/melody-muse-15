## Regência — Painel do Professor

Nova aba exclusiva para professores chamada **Regência** (`/regencia`) com controle de acesso dos alunos e criação de apostilas.

### 1. Banco de dados (Lovable Cloud)

- `profiles`: novas colunas `teacher_id uuid` (professor escolhido pelo aluno) e `unlocked_instruments text[]` (instrumentos liberados além do principal).
- `apostilas`: `id, teacher_id, title, description, instrument, content jsonb, pdf_url, source ('editor'|'blocos'|'upload'), created_at, updated_at`. RLS: professor CRUD nas suas; alunos dele leem.
- `apostila_reads` (opcional futuro) — pular por ora.
- Bucket de storage `apostilas` (privado) para PDFs enviados/gerados; RLS por `teacher_id` no path.
- RLS: aluno lê `profiles` do professor dele e lista de professores do seu instrumento (view pública minimalista `public_teachers` com id, nome, avatar, instrumento, bio).

### 2. Fluxo do aluno

- Na criação da conta, ao escolher "Aluno" e um instrumento, o app redireciona para `/escolher-professor?instrumento=X` listando professores daquele instrumento (card com nome, foto, bio). Pode pular ("Sem professor por enquanto").
- Depois de escolher, `profiles.teacher_id` é gravado.
- Guarda de conteúdo: hook `useContentAccess()` retorna quais instrumentos/rotas o aluno pode ver = `[instrument principal, ...unlocked_instruments]`. Sem professor ou sem liberação → só o instrumento escolhido.
- Rotas de estudo/escalas/acordes/afinador/etc. verificam o hook. Instrumento bloqueado exibe cadeado com texto "Peça ao seu professor para liberar".
- Admins e professores ignoram bloqueio.

### 3. Página `/regencia` (só para role=teacher e admin)

Três abas:

**a) Meus Alunos**
- Lista alunos onde `teacher_id = professor atual`.
- Por aluno: instrumento principal + chips dos instrumentos extras liberados, com toggle para liberar/trancar cada instrumento do app.

**b) Apostilas**
- Botão "Nova apostila" abre modal com 3 opções: **Editor de texto rico**, **Montar por blocos musicais** (acorde, escala, ritmo, texto), **Enviar PDF pronto**.
- Editor rico: `contenteditable` simples com bold/itálico/heading/lista + inserir imagem por URL. Salva HTML em `content.html`.
- Blocos: adiciona blocos ordenados (texto, acorde com nome, escala com tonalidade, ritmo com bpm). Salva array em `content.blocks`.
- Upload PDF: sobe para storage `apostilas/{teacher_id}/{uuid}.pdf`, grava `pdf_url`.
- Cada apostila fica visível para todos os alunos do professor cujo instrumento principal bata com o da apostila (ou "todos" se o professor marcar).
- Botão **Exportar PDF** em cada apostila:
  - Se `source='upload'`: baixa o próprio PDF.
  - Se editor/blocos: gera PDF client-side via `jspdf` + `html2canvas` a partir de uma view renderizada.

**c) Meu perfil de professor**
- Edita bio pública e instrumentos que ensina (multi). Já existe parte disso em `/conta`; aqui é um atalho + destaque de "aparecer para alunos".

### 4. Visualização do aluno

- Nova rota `/apostilas` no menu do aluno mostra as apostilas do seu professor. Cada uma abre em `/apostilas/$id` renderizando o HTML/blocos ou embed do PDF, com botão baixar.

### 5. Navegação

- Header: item **Regência** aparece só para professores/admin.
- Header: item **Apostilas** aparece só para alunos com professor definido.

### 6. Detalhes técnicos

- Pacotes novos: `jspdf`, `html2canvas`.
- Nome interno da aba: rota `/regencia`; UI mostra "Regência — Sala do Professor".
- RLS chave:
  - `apostilas` SELECT: `teacher_id = auth.uid()` OU (aluno) `EXISTS(profiles WHERE id=auth.uid() AND teacher_id=apostilas.teacher_id)`.
  - `profiles` SELECT extra: aluno pode ver o profile do seu professor; professor pode ver profiles dos seus alunos.
  - `profiles` UPDATE extra: professor pode atualizar `unlocked_instruments` dos alunos vinculados (via função SECURITY DEFINER `teacher_set_unlocked(student_id, instruments[])`).
- Storage: bucket `apostilas` privado, policy que permite ao professor CRUD no seu prefixo e alunos vinculados só leitura.

Se aprovado, executo migração do banco + bucket, depois todo o código de UI em uma leva.
