-- Rename existing persisted FAQ branding after the product rename.
UPDATE faqs
SET topic = REPLACE(topic, 'Learning Hub', 'Learning Compass'),
    question = REPLACE(question, 'Learning Hub', 'Learning Compass'),
    answer = REPLACE(answer, 'Learning Hub', 'Learning Compass'),
    keywords = REPLACE(keywords, 'Learning Hub', 'Learning Compass')
WHERE topic LIKE '%Learning Hub%'
   OR question LIKE '%Learning Hub%'
   OR answer LIKE '%Learning Hub%'
   OR keywords LIKE '%Learning Hub%';
