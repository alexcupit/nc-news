const db = require('../db/connection.js');

exports.fetchArticles = (topic, sort_by = 'created_at', order = 'DESC') => {
  const validTopics = ['mitch', 'cats', 'paper'];
  const validColumns = [
    'title',
    'topic',
    'author',
    'body',
    'votes',
    'created_at',
    'article_id',
  ];
  const validOrders = ['ASC', 'DESC'];
  let queryValues = [];

  let queryStr = `
    SELECT article_id, title, articles.author, topic, articles.created_at, articles.votes, COUNT(comment_id) AS comment_count
    FROM articles
    LEFT JOIN comments
    USING (article_id)`;

  if (topic) {
    const lowerTopic = topic.toLowerCase();
    if (validTopics.includes(lowerTopic)) {
      queryValues.push(lowerTopic);
      queryStr += ` WHERE topic = $1`;
    } else {
      return Promise.reject({ status: 400, msg: 'invalid topic query' });
    }
  }

  if (!validColumns.includes(sort_by.toLowerCase())) {
    return Promise.reject({ status: 400, msg: 'invalid sort_by query' });
  }

  if (!validOrders.includes(order.toUpperCase())) {
    return Promise.reject({ status: 400, msg: 'order must be asc or desc' });
  }

  queryStr += ` 
    GROUP BY articles.article_id
    ORDER BY articles.${sort_by.toLowerCase()} ${order};`;

  return db.query(queryStr, queryValues).then((res) => {
    return res.rows;
  });
};

exports.fetchArticleById = (article_id) => {
  return db
    .query(
      `
        SELECT * 
        FROM articles
        WHERE article_id = $1;`,
      [article_id]
    )
    .then((res) => {
      if (!res.rows.length) {
        return Promise.reject({ status: 404, msg: 'id not found' });
      } else return res.rows[0];
    });
};

exports.updateArticleById = (article_id, inc_votes) => {
  return this.fetchArticleById(article_id)
    .then(() => {
      return db.query(
        `
    UPDATE articles
    SET votes = votes + $2
    WHERE article_id = $1
    RETURNING *;`,
        [article_id, inc_votes]
      );
    })
    .then((res) => res.rows[0]);
};
