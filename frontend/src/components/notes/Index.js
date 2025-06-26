import { Link } from "react-router-dom"
import { Badge, Stack } from "react-bootstrap"


const Index = ({ filteredNote }) => {

  return (
    <>
      {filteredNote.map((note, index) => (
        <div className="col-lg-3" key={index}>
          <Link to={`/note/view/${note._id}`} className="text-decoration-none text-muted">
            <div className="card my-2">
              <div className="card-body">
                <h5 className="card-title">{note.title}</h5>
                  <Stack gap={1} direction="horizontal" className="flex-wrap">
                    {note.tag.map((tags, indexs) => (
                      <Badge className="text-truncate" key={indexs}>{tags}</Badge>
                    ))}
                  </Stack>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </>
  )
}

export default Index