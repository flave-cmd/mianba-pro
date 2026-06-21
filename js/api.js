/**
 * 面霸Pro - Dify API 调用模块
 */

const DIFY_BASE_URL = 'https://api.dify.ai/v1';
const DIFY_API_KEY_PREDICTION = 'app-Gzw1MZF7j38Fk6w39Yk03fyS';
const DIFY_API_KEY_REVIEW = 'app-27slldwJIB33ASEUklhPVx0d';

/**
 * 上传文件到 Dify，返回 file_id
 * @param {File} file - 要上传的文件对象
 * @param {string} apiKey - 对应工作流的 API Key
 * @param {string} user - 用户标识（必须与工作流调用的 user 一致）
 * @returns {Promise<string>} file_id
 */
async function uploadFileToDify(file, apiKey, user) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user', user);

  const response = await fetch(DIFY_BASE_URL + '/files/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('文件上传失败: ' + response.status + ' ' + errText);
  }

  const data = await response.json();
  return data.id;
}

function buildFileVariable(fileId, type) {
  return { transfer_method: 'local_file', upload_file_id: fileId, type: type };
}

/**
 * 调用智能押题工作流
 */
async function runPredictionWorkflow(resumeFile, jdText, position, jobType) {
  // 生成固定的 user，确保上传和调用时一致
  const user = 'web-user-' + Date.now();

  // 第一步：上传简历文件
  const fileId = await uploadFileToDify(resumeFile, DIFY_API_KEY_PREDICTION, user);

  // 第二步：调用工作流
  const response = await fetch(DIFY_BASE_URL + '/workflows/run', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + DIFY_API_KEY_PREDICTION, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: {
        jian_li: buildFileVariable(fileId, 'document'),
        gang_wei_na_me: position,
        qiu_zhi_lei_xing: jobType,
        j_d: jdText
      },
      response_mode: 'blocking',
      user: user
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('工作流调用失败: ' + response.status + ' ' + errText);
  }

  return await response.json();
}

/**
 * 调用面试复盘工作流
 */
async function runReviewWorkflow(transcriptFile, company, jobTitle) {
  // 生成固定的 user，确保上传和调用时一致
  const user = 'web-user-' + Date.now();

  // 第一步：上传文稿文件
  const fileId = await uploadFileToDify(transcriptFile, DIFY_API_KEY_REVIEW, user);

  // 第二步：调用工作流
  const response = await fetch(DIFY_BASE_URL + '/workflows/run', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + DIFY_API_KEY_REVIEW, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: {
        Interview_file: buildFileVariable(fileId, 'document'),
        Company_Name: company,
        Job_Title: jobTitle
      },
      response_mode: 'blocking',
      user: user
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('工作流调用失败: ' + response.status + ' ' + errText);
  }

  return await response.json();
}
