const getDateAndDay = (req, res, next) => {
    const { time } = req.body;
  
    if (!time) {
      return res
        .status(400)
        .json({ error: "Time is required in the request body." });
    }
  
    try {
      const parsedTime = new Date(time);
      const day = parsedTime.toLocaleDateString("en-US", { weekday: "long" });
      
      // Format the date as "dd-mm-yyyy"
      const date = parsedTime.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
  
      req.parsedTime = parsedTime;
      req.day = day;
      req.date = date;
      next();
    } catch (error) {
      console.error("Error parsing time:", error);
      return res.status(400).json({ error: "Invalid time format." });
    }
  };
  
  module.exports = { getDateAndDay };
  