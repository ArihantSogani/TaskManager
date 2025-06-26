import Delete from './Delete'

const Index = ({ filteredLists }) => {

  return (
    <>
      {filteredLists.map((user, index) => (
        <tr key={user._id}>
          <td>{index + 1}</td>
          <td>{user.name}</td>
          <td><Delete user={user}/></td>
        </tr>
      ))}
    </>
  )
}

export default Index