---
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König (=> AI-Translation)
  reviewDate: 2025-11-24
---

# O Ciclo p2d2

O ciclo p2d2 descreve o fluxo de dados bidirecional entre administração, portal de Dados Abertos, comunidade p2d2 e plataformas públicas de dados. O processo consiste em **9 etapas**:

![Ciclo p2d2 - Fluxo de Dados Bidirecional](/assets/p2d2-zyklus.png)
*Figura: O ciclo p2d2 visualiza o fluxo de dados bidirecional entre administração, comunidade p2d2 e plataformas públicas*

## 1. Administração Cria Dados

Funcionários administrativos coletam e mantêm dados em **sistemas especializados**:

- Software de gerenciamento de cemitérios
- Sistemas GIS da administração
- Bancos de dados especializados

**Exemplo**: Um novo cemitério é criado no GIS municipal.

## 2. Publicação Automatizada

Os dados são **automaticamente** publicados no **portal de Dados Abertos** do município:

- Exportação de sistemas especializados
- Transformação em formatos de Dados Abertos (ex.: GeoJSON, CSV)
- Disponibilização via API do portal

**Exemplo**: Dados de cemitérios aparecem atualizados diariamente em offenedaten-koeln.de.

## 3. p2d2 Assume Dados

O p2d2 **importa** os dados automaticamente do portal de Dados Abertos:

- Sincronização regular (ex.: diariamente)
- Transformação em modelo de dados unificado
- Armazenamento em banco de dados PostGIS

**Exemplo**: Novos cemitérios são carregados automaticamente no p2d2.

## 4. Usuários Editam Dados

**Usuários do p2d2** revisam e melhoram os dados:

- Correção de geometrias (limites, entradas)
- Adição de atributos ausentes
- Adição de fotos ou descrições
- Marcação para garantia de qualidade

**Exemplo**: Um usuário corrige a entrada do cemitério e adiciona horários de funcionamento.

## 5. Comunidade Verifica Qualidade

A **comunidade p2d2** revisa as alterações:

- Revisão por usuários experientes
- Verificação de completude e consistência
- Aprovação para importação em massa no OSM/WikiData
- Ou: Rejeição com justificativa

**Exemplo**: Um moderador da comunidade revisa as alterações e as aprova.

## 6. Transferência Automatizada

Após aprovação, os dados são **automaticamente transferidos**:

- **OpenStreetMap**: Via OSM-API ou JOSM
- **WikiData**: Via WikiData-API
- **Outras plataformas**: Dependendo da configuração

**Exemplo**: O cemitério corrigido é importado no OSM.

## 7. Alterações Disparam Notificação

Alterações nos dados em plataformas públicas disparam **notificações**:

- Changesets do OSM são monitorados
- Edições do WikiData são rastreadas
- Departamento especializado recebe notificação

**Exemplo**: A administração do cemitério é informada sobre a alteração no OSM.

## 8. Administração Revisa Alteração

**Funcionários administrativos** revisam a alteração:

- Verificação da correção
- Decisão: Adotar ou rejeitar
- Se adotado: Atualização no sistema especializado

**Exemplo**: A administração adota os horários de funcionamento corrigidos.

## 9. Ciclo Completo: Dados Melhorados

Os **dados melhorados** estão agora disponíveis para todos:

- Sistema especializado tem dados atuais
- Portal de Dados Abertos é atualizado
- p2d2 sincroniza as alterações
- OSM/WikiData têm dados com qualidade garantida

**Exemplo**: O cemitério está agora correta e atualmente registrado em todos os sistemas.

---

## Vantagens do Ciclo

- **Bidirecionalidade**: Dados fluem em ambas as direções
- **Garantia de Qualidade**: Comunidade e administração verificam juntas
- **Atualidade**: Alterações são adotadas prontamente
- **Transparência**: Todas as etapas são rastreáveis
- **Eficiência**: Não há mais trabalho duplicado

## Implementação Técnica

O ciclo é possibilitado por vários componentes:

- **Automação**: Cronjobs, webhooks, APIs
- **Versionamento**: Histórico de alterações semelhante ao Git
- **Notificações**: E-mail, RSS, webhooks
- **Interfaces**: REST-APIs, serviços OGC

::: tip
O ciclo p2d2 é o coração da aplicação e diferencia o p2d2 de ferramentas de coleta de dados puras.
:::
