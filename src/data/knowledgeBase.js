const TOPICS = [
  {
    key: "rag",
    label: "RAG",
    keywords: ["rag", "retrieval augmented generation", "retrieval"],
    shortAnswer:
      "RAG la cach ket hop tim tai lieu lien quan truoc, sau do dua noi dung do vao mo hinh de cau tra loi co boi canh hon.",
    simplerAnswer:
      "Hay hinh dung AI duoc mo sach tham khao truoc khi tra loi. No tim dung trang can doc roi moi tra loi, thay vi nho moi thu trong dau.",
    reflectionQuestion: "Ban da hieu phan retrieval trong RAG chua?",
    knowledgeGaps: ["retrieval", "embedding"],
    followUpSuggestions: [
      "Retrieval la gi?",
      "Embedding la gi?",
      "RAG khac fine-tuning the nao?",
    ],
  },
  {
    key: "embedding",
    label: "Embedding",
    keywords: ["embedding", "vector hoa", "vector embedding"],
    shortAnswer:
      "Embedding la cach bien text thanh day so de may tinh do duoc muc do gan nhau ve y nghia.",
    simplerAnswer:
      "Neu hai cau co y tuong giong nhau, embedding giup dat chung gan nhau trong mot ban do so hoc.",
    reflectionQuestion: "Ban da hieu vi sao can bien text thanh vector chua?",
    knowledgeGaps: ["vector space", "similarity search"],
    followUpSuggestions: [
      "Similarity search la gi?",
      "Vector database la gi?",
      "Embedding dung trong semantic search nhu the nao?",
    ],
  },
  {
    key: "vector-database",
    label: "Vector Database",
    keywords: ["vector database", "vectordb", "milvus", "pinecone", "weaviate"],
    shortAnswer:
      "Vector database la he co so du lieu toi uu cho viec luu vector va tim cac vector giong nhau nhanh.",
    simplerAnswer:
      "No giong nhu mot thu vien sap xep tai lieu theo y nghia thay vi sap xep theo tu khoa exact match.",
    reflectionQuestion: "Ban da thay duoc moi lien he giua embedding va vector database chua?",
    knowledgeGaps: ["indexing", "nearest neighbor search"],
    followUpSuggestions: [
      "Nearest neighbor search la gi?",
      "Embedding duoc dua vao vector DB ra sao?",
      "Khi nao can dung vector database?",
    ],
  },
  {
    key: "fine-tuning",
    label: "Fine-tuning",
    keywords: ["fine tuning", "fine-tuning", "train them", "huan luyen them"],
    shortAnswer:
      "Fine-tuning la viec dieu chinh mo hinh tren bo du lieu rieng de no hoc cach phan hoi phu hop hon voi mot tac vu cu the.",
    simplerAnswer:
      "Neu prompt la cach huong dan tam thoi, thi fine-tuning la cach day mo hinh mot thoi quen moi lau dai hon.",
    reflectionQuestion: "Ban da phan biet duoc fine-tuning voi prompt va RAG chua?",
    knowledgeGaps: ["training data quality", "task specialization"],
    followUpSuggestions: [
      "Fine-tuning khac prompt engineering the nao?",
      "Khi nao nen chon RAG thay vi fine-tuning?",
      "Can du lieu gi de fine-tuning?",
    ],
  },
  {
    key: "prompt-engineering",
    label: "Prompt Engineering",
    keywords: ["prompt", "prompt engineering", "viet prompt"],
    shortAnswer:
      "Prompt engineering la cach thiet ke dau vao ro rang, co ngu canh va rang buoc de mo hinh tra loi dung muc tieu hon.",
    simplerAnswer:
      "Ban cang dat de bai ro, AI cang de tra loi dung. Prompt engineering la ky nang viet de bai do.",
    reflectionQuestion: "Ban da thay prompt tot can nhung thanh phan nao chua?",
    knowledgeGaps: ["context design", "output constraints"],
    followUpSuggestions: [
      "Prompt tot can nhung thanh phan nao?",
      "Few-shot prompting la gi?",
      "Cach kiem soat format output cua AI?",
    ],
  },
  {
    key: "agent",
    label: "AI Agent",
    keywords: ["agent", "ai agent", "multi step workflow", "tool use"],
    shortAnswer:
      "AI agent la he thong dung mo hinh de lap ke hoach, goi cong cu va thuc hien nhieu buoc thay vi chi tra loi mot lan.",
    simplerAnswer:
      "Chatbot thuong tra loi ngay. Agent thi co the nghi theo buoc, lam viec, kiem tra va quay lai ket qua.",
    reflectionQuestion: "Ban da hieu diem khac nhau giua chatbot va agent chua?",
    knowledgeGaps: ["planning", "tool invocation"],
    followUpSuggestions: [
      "Agent khac workflow rule-based the nao?",
      "Tool calling la gi?",
      "Rui ro khi xay AI agent la gi?",
    ],
  },
  {
    key: "generic",
    label: "General Learning Topic",
    keywords: [],
    shortAnswer:
      "Minh se tom tat y chinh cua cau hoi truoc, sau do kiem tra xem ban da nam duoc phan cot loi chua.",
    simplerAnswer:
      "Muc tieu la tach chu de thanh cac y nho, de hieu hon va de hoc tiep tung buoc.",
    reflectionQuestion: "Ban da nam duoc y chinh cua chu de nay chua?",
    knowledgeGaps: ["core concept", "applied example"],
    followUpSuggestions: [
      "Cho minh mot vi du de hieu hon",
      "Chu de nay ung dung o dau?",
      "Co khai niem nen hoc truoc khong?",
    ],
  },
];

function normalize(input) {
  return String(input || "")
    .trim()
    .toLowerCase();
}

function findTopicByQuestion(question) {
  const normalizedQuestion = normalize(question);
  return (
    TOPICS.find((topic) =>
      topic.keywords.some((keyword) => normalizedQuestion.includes(keyword))
    ) || TOPICS.find((topic) => topic.key === "generic")
  );
}

function getTopicByKey(key) {
  return TOPICS.find((topic) => topic.key === key) || TOPICS[TOPICS.length - 1];
}

module.exports = {
  TOPICS,
  findTopicByQuestion,
  getTopicByKey,
};
