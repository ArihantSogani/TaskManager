const Label = require('../models/Label')

// Get all labels for dropdown
exports.getAllLabels = async (req, res, next) => {
  try {
    console.log('Fetching all labels...')
    const labels = await Label.find().sort({ name: 1 }).lean()
    console.log('Found labels:', labels)
    const labelOptions = labels.map(label => ({
      value: label.name,
      label: label.name
    }))
    
    console.log('Sending label options:', labelOptions)
    res.status(200).json(labelOptions)
  } catch (error) {
    console.error('Error fetching labels:', error)
    next(error)
  }
}

// Create or update label usage
exports.createOrUpdateLabels = async (labelNames, createdBy) => {
  try {
    console.log('Creating/updating labels:', labelNames, 'for user:', createdBy)
    const labelPromises = labelNames.map(async (labelName) => {
      const trimmedName = labelName.trim()
      if (!trimmedName) return null

      // Try to find existing label
      let label = await Label.findOne({ name: trimmedName })
      
      if (!label) {
        // Create new label only if it doesn't exist
        console.log('Creating new label:', trimmedName)
        label = await Label.create({
          name: trimmedName,
          createdBy: createdBy
        })
        console.log('Created label:', label)
      } else {
        console.log('Label already exists:', trimmedName)
      }
      
      return label
    })

    const results = await Promise.all(labelPromises)
    const filteredResults = results.filter(Boolean)
    console.log('Final results:', filteredResults)
    return filteredResults
  } catch (error) {
    console.error('Error creating/updating labels:', error)
    throw error
  }
} 